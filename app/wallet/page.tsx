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

      // Transactions - Only show earnings and withdrawals
      const { data: txs, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .in("type", ['earning', 'withdrawal'])
        .order("created_at", { ascending: false })
        .limit(50)
      if (txError) throw txError
      setTransactions(txs ?? [])

      // Referrals
      const { data: refs, error: refError } = await supabase
        .from("referrals")
        .select(`
          id,
          referred_id,
          bonus,
          referral_date,
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

  const handleWithdrawalRequest = async () => {
    if (!user) return
    try {
      const { error } = await supabase.from("withdrawal_requests").insert([
        { user_id: user.id, amount: walletData?.wallet_balance ?? 0, status: "pending" }
      ])
      if (error) throw error
      toast.success("Withdrawal request submitted!")
    } catch (err) {
      console.error(err)
      toast.error("Failed to submit withdrawal request.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  if (!user) return null

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
              <WalletBalance wallet={walletData?.wallet_balance ?? 0} />
              <EarningsConverter /> {/* Only once */}
              <TransactionHistory transactions={transactions} />
            </div>

            {/* Right Section */}
            <div className="space-y-6 lg:space-y-8">
              {/* Withdrawal Section */}
              <div className="p-6 bg-slate-800/30 rounded-xl">
                <h3 className="font-bold text-cyan-400 text-lg mb-2">Withdrawals</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Withdrawals are available once you’ve completed <b>1 month</b> on the platform.
                  After that, you may submit a request anytime.
                </p>
                <button
                  className={`w-full px-4 py-2 rounded-lg font-semibold ${
                    canWithdraw
                      ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                      : "bg-slate-600 text-slate-400 cursor-not-allowed"
                  }`}
                  onClick={handleWithdrawalRequest}
                  disabled={!canWithdraw}
                >
                  Request Withdrawal
                </button>
                {!canWithdraw && (
                  <p className="text-xs text-slate-400 mt-2">
                    Withdrawals will open automatically after your first month.
                  </p>
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
                    <th className="px-4 py-2">Bonus (ED)</th>
                    <th className="px-4 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((ref) => (
                    <tr key={ref.id} className="border-b border-slate-700">
                      <td className="px-4 py-2">{ref.referred_user?.username ?? "N/A"}</td>
                      <td className="px-4 py-2">{ref.referred_user?.email ?? "N/A"}</td>
                      <td className="px-4 py-2 font-bold">{ref.bonus}</td>
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
