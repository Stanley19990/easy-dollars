// app/wallet/page.tsx - COMPLETELY FIXED WITH AMOUNT INPUT
"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { WalletBalance } from "@/components/wallet-balance"
import { TransactionHistory } from "@/components/transaction-history"
import { EarningsConverter } from "@/components/earnings-converter"
import { FloatingParticles } from "@/components/floating-particles"
import { Toaster, toast } from "sonner"
import { supabase } from "@/lib/supabase"

export default function WalletPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [walletData, setWalletData] = useState<{ wallet_balance: number, created_at?: string } | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [referrals, setReferrals] = useState<any[]>([])
  const [canWithdraw, setCanWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState("") // ✅ NEW: Amount input state
  const [withdrawMethod, setWithdrawMethod] = useState("") // ✅ NEW: Method selection
  const [accountDetails, setAccountDetails] = useState("") // ✅ NEW: Account details
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  
  // ✅ NEW: Special user ID
  const SPECIAL_USER_ID = 'c48142ec-6d81-491c-86b9-89432ae34f62'
  const isSpecialUser = user?.id === SPECIAL_USER_ID

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) router.push("/")
  }, [user, loading, router])

  // Fetch wallet, transactions, and referrals
  const fetchWalletData = async () => {
    if (!user) return

    try {
      // Wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from("users")
        .select("wallet_balance, created_at")
        .eq("id", user.id)
        .single()

      if (walletError) throw walletError
      setWalletData(wallet)

      // Check 1 month condition
      if (wallet?.created_at) {
        const createdAt = new Date(wallet.created_at)
        const oneMonthLater = new Date(createdAt)
        oneMonthLater.setMonth(createdAt.getMonth() + 1)
        setCanWithdraw(new Date() >= oneMonthLater)
      }

      // Transactions - Show ALL transaction types
      const { data: txs, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)

      if (txError) throw txError
      setTransactions(txs || [])

      // Referrals
      const { data: refs, error: refError } = await supabase
        .from("referrals")
        .select(`
          id, referred_id, bonus, referral_date,
          referred_user:users!referrals_referred_id_fkey(username, email)
        `)
        .eq("referrer_id", user.id)
        .order("referral_date", { ascending: false })

      if (refError) throw refError
      setReferrals(refs ?? [])
    } catch (error) {
      console.error("Wallet fetch error:", error)
      toast.error("Failed to load wallet data")
    }
  }

  useEffect(() => {
    fetchWalletData()
  }, [user])

  // ✅ NEW: Real-time subscription for balance updates
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('wallet-balance-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('💰 Balance updated in real-time:', payload)
          const newData = payload.new as any
          setWalletData({
            wallet_balance: newData.wallet_balance || 0,
            created_at: newData.created_at
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📝 New transaction detected:', payload)
          fetchWalletData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // ✅ UPDATED: Safe withdrawal request with amount selection
  const handleWithdrawalRequest = async () => {
    if (!user || !walletData) return

    // ✅ Validate amount input
    const amountInput = parseFloat(withdrawAmount)
    if (!amountInput || amountInput <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (amountInput < 3000) {
      toast.error("Minimum withdrawal amount is 3,000 XAF")
      return
    }

    if (amountInput > walletData.wallet_balance) {
      toast.error("Insufficient balance")
      return
    }

    if (isSpecialUser && (!withdrawMethod || !accountDetails)) {
      toast.error("Please select payment method and enter account details")
      return
    }

    if (!isSpecialUser && !canWithdraw) {
      toast.error("As a new user you need to make at least one month in the app to be able to submit your info for verifications before your first withdrawal")
      return
    }

    setIsWithdrawing(true)

    try {
      // ✅ FIRST: Create withdrawal record with correct status
      const withdrawalData: any = {
        user_id: user.id,
        amount: amountInput,
        status: isSpecialUser ? 'approved' : 'pending',
        processed_at: isSpecialUser ? new Date().toISOString() : null
      }

      // ✅ Add method and details only for special user (instant withdrawals)
      if (isSpecialUser) {
        withdrawalData.method = withdrawMethod
        withdrawalData.account_details = accountDetails
      }

      const { data: withdrawal, error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert(withdrawalData)
        .select()
        .single()

      if (withdrawalError) {
        console.error('Withdrawal record error:', withdrawalError)
        throw new Error(`Failed to create withdrawal record: ${withdrawalError.message}`)
      }

      console.log('✅ Withdrawal record created:', withdrawal)

      if (isSpecialUser) {
        // ✅ SAFE WITHDRAWAL: Calculate new balance correctly
        const newBalance = Math.max(0, walletData.wallet_balance - amountInput)
        
        console.log('💰 Balance update:', {
          current: walletData.wallet_balance,
          withdrawal: amountInput,
          new: newBalance
        })

        // ✅ FIXED: Update user balance WITHOUT RPC function
        const { error: balanceError } = await supabase
          .from('users')
          .update({ 
            wallet_balance: newBalance
            // Removed the problematic RPC call
          })
          .eq('id', user.id)

        if (balanceError) {
          console.error('Balance update error:', balanceError)
          // ✅ ROLLBACK: Delete withdrawal record if balance update fails
          await supabase
            .from('withdrawals')
            .delete()
            .eq('id', withdrawal.id)
          throw new Error(`Failed to update balance: ${balanceError.message}`)
        }

        // ✅ CREATE TRANSACTION RECORD
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            type: 'withdrawal',
            description: `Instant withdrawal via ${withdrawMethod} #${withdrawal.id}`,
            amount: amountInput,
            currency: 'XAF',
            status: 'completed',
            external_id: `withdrawal_${withdrawal.id}`,
            metadata: {
              withdrawal_id: withdrawal.id,
              withdrawal_type: 'instant',
              method: withdrawMethod,
              account_details: accountDetails,
              processed_at: new Date().toISOString()
            }
          })

        if (transactionError) {
          console.error('Transaction record error:', transactionError)
          // Don't rollback if transaction record fails - balance is already updated
        }

        toast.success(`✅ Withdrawal Successful! ${amountInput.toLocaleString()} XAF has been withdrawn.`)
        
        // Clear form
        setWithdrawAmount("")
        setWithdrawMethod("")
        setAccountDetails("")
      } else {
        toast.success(`Withdrawal request submitted for ${amountInput.toLocaleString()} XAF!`)
        setWithdrawAmount("")
      }

      // Refresh data
      await fetchWalletData()
      
    } catch (err: any) {
      console.error('Withdrawal error:', err)
      toast.error(err.message || "Failed to submit withdrawal request.")
      
      // ✅ SAFETY: Force refresh wallet data to ensure UI is correct
      setTimeout(() => fetchWalletData(), 1000)
    } finally {
      setIsWithdrawing(false)
    }
  }

  // ✅ Function to restore balance if needed (emergency fix)
  const restoreBalance = async () => {
    if (!user) return
    
    try {
      toast.loading("Checking balance...")
      
      // Get current balance from database
      const { data: currentUser, error } = await supabase
        .from('users')
        .select('wallet_balance, total_earned')
        .eq('id', user.id)
        .single()
        
      if (error) throw error
      
      // If balance is 0 but should have money, restore from last earnings
      if (currentUser.wallet_balance === 0) {
        // Calculate total earnings from transactions
        const { data: earnings } = await supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', user.id)
          .in('type', ['mining_earnings', 'referral_bonus', 'social_bonus'])
          .eq('status', 'completed')
        
        const totalEarned = earnings?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0
        
        if (totalEarned > 0) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ wallet_balance: totalEarned })
            .eq('id', user.id)
            
          if (updateError) throw updateError
          
          toast.success(`Balance restored to ${totalEarned.toLocaleString()} XAF!`)
          fetchWalletData()
        } else {
          toast.dismiss()
          toast.info("No earnings found to restore")
        }
      } else {
        toast.dismiss()
      }
    } catch (error) {
      console.error('Restore balance error:', error)
      toast.error("Failed to restore balance")
    }
  }

  // Payment methods for special user
  const paymentMethods = [
    { value: "bank", label: "Bank Transfer" },
    { value: "mobile_money_mtn", label: "MTN Mobile Money" },
    { value: "mobile_money_orange", label: "Orange Money" },
    { value: "paypal", label: "PayPal" },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  if (!user) return null

  const currentBalance = walletData?.wallet_balance || 0

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <FloatingParticles />
      <div className="relative z-10">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-6 lg:py-8 space-y-6 lg:space-y-8">
          <div className="text-center mb-6 lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
              My Wallet
            </h1>
            <p className="text-slate-400 text-sm lg:text-base">
              View your earnings, referrals, convert ED to XAF, and request withdrawals
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Section */}
            <div className="xl:col-span-2 space-y-6 lg:space-y-8">
              <WalletBalance wallet={currentBalance} />
              <EarningsConverter />
              <TransactionHistory transactions={transactions} />
            </div>

            {/* Right Section */}
            <div className="space-y-6 lg:space-y-8">
              {/* Withdrawal Section */}
              <div className="p-6 bg-slate-800/30 rounded-xl">
                <h3 className="font-bold text-cyan-400 text-lg mb-2">Withdrawals</h3>
                <p className="text-slate-400 text-sm mb-4">
                  {isSpecialUser ? (
                    <>⚡ <strong className="text-green-400">Instant Withdrawals Enabled!</strong> Your withdrawals are approved immediately.</>
                  ) : (
                    <>Withdrawals are available once you've completed <b>1 month</b> on the platform. After that, you may submit a request anytime.</>
                  )}
                </p>

                {/* Available Balance Display */}
                <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
                  <p className="text-slate-300 text-sm">Available Balance</p>
                  <p className="text-2xl font-bold text-green-400">
                    {currentBalance.toLocaleString()} XAF
                  </p>
                </div>

                {/* ✅ NEW: Amount Input */}
                <div className="mb-4">
                  <label className="block text-slate-300 text-sm mb-2">
                    Withdrawal Amount (XAF)
                  </label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="3000"
                    max={currentBalance}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                  <div className="text-xs text-slate-400 mt-1">
                    Minimum: 3,000 XAF • Maximum: {currentBalance.toLocaleString()} XAF
                  </div>
                </div>

                {/* ✅ NEW: Payment Method (only for special user) */}
                {isSpecialUser && (
                  <>
                    <div className="mb-4">
                      <label className="block text-slate-300 text-sm mb-2">
                        Payment Method
                      </label>
                      <select
                        value={withdrawMethod}
                        onChange={(e) => setWithdrawMethod(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="">Select payment method</option>
                        {paymentMethods.map((method) => (
                          <option key={method.value} value={method.value}>
                            {method.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="block text-slate-300 text-sm mb-2">
                        Account Details
                      </label>
                      <textarea
                        value={accountDetails}
                        onChange={(e) => setAccountDetails(e.target.value)}
                        placeholder="Enter your account details (account number, mobile money number, PayPal email, etc.)"
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 min-h-[80px]"
                      />
                    </div>
                  </>
                )}

                <button
                  className={`w-full px-4 py-3 rounded-lg font-semibold ${
                    (isSpecialUser || canWithdraw)
                      ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                      : "bg-slate-600 text-slate-400 cursor-not-allowed"
                  }`}
                  onClick={handleWithdrawalRequest}
                  disabled={
                    isWithdrawing ||
                    (!isSpecialUser && !canWithdraw) ||
                    !withdrawAmount ||
                    parseFloat(withdrawAmount) < 3000 ||
                    parseFloat(withdrawAmount) > currentBalance ||
                    (isSpecialUser && (!withdrawMethod || !accountDetails))
                  }
                >
                  {isWithdrawing ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </span>
                  ) : isSpecialUser ? (
                    "Withdraw Now (Instant)"
                  ) : canWithdraw ? (
                    "Request Withdrawal"
                  ) : (
                    "Withdrawal Locked"
                  )}
                </button>

                {!isSpecialUser && !canWithdraw && (
                  <p className="text-xs text-red-400 mt-2">
                    As a new user you need to make at least one month in the app to be able to submit your info for verifications before your first withdrawal
                  </p>
                )}

                {isSpecialUser && (
                  <p className="text-xs text-green-400 mt-2">
                    ⚡ Instant withdrawals approved for your account
                  </p>
                )}

                {/* Emergency Balance Restore Button */}
                {isSpecialUser && currentBalance === 0 && (
                  <button
                    onClick={restoreBalance}
                    className="w-full mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm"
                  >
                    🔄 Restore Balance (Emergency)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Referrals Table */}
          <div className="mt-8 p-6 bg-slate-800/30 rounded-xl">
            <h3 className="font-bold text-cyan-400 text-lg mb-4">Your Referrals & Bonuses</h3>
            {referrals.length === 0 ? (
              <p className="text-slate-400">You have no referrals yet.</p>
            ) : (
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-xs uppercase bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-2">Username</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Bonus (XAF)</th>
                    <th className="px-4 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((ref) => (
                    <tr key={ref.id} className="border-b border-slate-700">
                      <td className="px-4 py-2">{ref.referred_user?.[0]?.username ?? ref.referred_user?.username ?? "N/A"}</td>
                      <td className="px-4 py-2">{ref.referred_user?.[0]?.email ?? ref.referred_user?.email ?? "N/A"}</td>
                      <td className="px-4 py-2 font-bold text-green-400">{ref.bonus} XAF</td>
                      <td className="px-4 py-2">{new Date(ref.referral_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
      <Toaster position="top-right" />
    </div>
  )
}