// components/withdrawal-section.tsx - COMPLETELY UPDATED WITH SAFE WITHDRAWAL LOGIC
"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CreditCard, Banknote, Smartphone } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface DatabaseUser {
  id: string
  created_at: string
  email?: string
  username?: string
  full_name?: string
  avatar_url?: string
  country?: string
  phone?: string
  referral_code?: string
  referred_by?: string
  wallet_balance: number
  ed_balance: number
  total_earned: number
  machines_owned: number
  last_earning_date?: string
  social_media_completed: boolean
  completed_social_links?: string[]
  social_media_bonus_paid: boolean
}

export function WithdrawalSection() {
  const { user: authUser, refreshUser } = useAuth()
  const [withdrawalData, setWithdrawalData] = useState({
    amount: "",
    method: "",
    accountDetails: "",
  })
  const [processing, setProcessing] = useState(false)
  const [canWithdraw, setCanWithdraw] = useState(false)
  const [minWithdrawalXAF] = useState(3000)

  // ✅ Special user ID
  const SPECIAL_USER_ID = 'c48142ec-6d81-491c-86b9-89432ae34f62'
  const isSpecialUser = authUser?.id === SPECIAL_USER_ID

  const user = authUser as unknown as DatabaseUser

  const paymentMethods = [
    { value: "bank", label: "Bank Transfer", icon: CreditCard },
    { value: "mobile_money_mtn", label: "MTN Mobile Money", icon: Smartphone },
    { value: "mobile_money_orange", label: "Orange Money", icon: Smartphone },
    { value: "paypal", label: "PayPal", icon: Banknote },
  ]

  useEffect(() => {
    if (user?.created_at) {
      const createdAt = new Date(user.created_at)
      const oneMonthLater = new Date(createdAt)
      oneMonthLater.setMonth(createdAt.getMonth() + 1)
      setCanWithdraw(new Date() >= oneMonthLater)
    }
  }, [user])

  // ✅ SAFE WITHDRAWAL FUNCTION WITH TRANSACTION ROLLBACK
  const handleWithdrawal = async () => {
    if (!user || !withdrawalData.amount || !withdrawalData.method || !withdrawalData.accountDetails) {
      toast.error("Please fill in all required fields")
      return
    }

    const amountXAF = Number.parseFloat(withdrawalData.amount)
    const userWalletBalanceXAF = user.wallet_balance || 0

    if (amountXAF <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (amountXAF > userWalletBalanceXAF) {
      toast.error("Insufficient balance")
      return
    }

    if (amountXAF < minWithdrawalXAF) {
      toast.error(`Minimum withdrawal amount is ${minWithdrawalXAF.toLocaleString()} XAF`)
      return
    }

    if (!isSpecialUser && !canWithdraw) {
      toast.error("As a new user you need to make at least one month in the app to be able to submit your info for verifications before your first withdrawal")
      return
    }

    setProcessing(true)

    try {
      // ✅ FIRST: Create withdrawal record
      const { data: withdrawal, error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount: amountXAF,
          method: withdrawalData.method,
          account_details: withdrawalData.accountDetails,
          status: isSpecialUser ? 'approved' : 'pending',
          processed_at: isSpecialUser ? new Date().toISOString() : null
        })
        .select()
        .single()

      if (withdrawalError) {
        console.error('Withdrawal record error:', withdrawalError)
        throw new Error(`Failed to create withdrawal record: ${withdrawalError.message}`)
      }

      console.log('✅ Withdrawal record created:', withdrawal)

      if (isSpecialUser) {
        // ✅ SAFE BALANCE UPDATE: Calculate new balance
        const newBalance = Math.max(0, userWalletBalanceXAF - amountXAF)
        
        console.log('💰 Balance calculation:', {
          current: userWalletBalanceXAF,
          withdrawal: amountXAF,
          new: newBalance
        })

        // ✅ UPDATE USER BALANCE
        const { error: balanceError } = await supabase
          .from('users')
          .update({ wallet_balance: newBalance })
          .eq('id', user.id)

        if (balanceError) {
          console.error('Balance update error:', balanceError)
          // ✅ ROLLBACK: Delete withdrawal record
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
            description: `Withdrawal via ${withdrawalData.method} #${withdrawal.id}`,
            amount: amountXAF,
            currency: 'XAF',
            status: 'completed',
            external_id: `withdrawal_${withdrawal.id}`,
            metadata: {
              withdrawal_id: withdrawal.id,
              method: withdrawalData.method,
              account_details: withdrawalData.accountDetails,
              processed_at: new Date().toISOString()
            }
          })

        if (transactionError) {
          console.error('Transaction record error:', transactionError)
          // Don't rollback for transaction error
        }

        toast.success(`✅ Withdrawal Successful! ${amountXAF.toLocaleString()} XAF has been withdrawn.`)
      } else {
        toast.success(`Withdrawal request of ${amountXAF.toLocaleString()} XAF submitted successfully!`)
      }

      // Clear form
      setWithdrawalData({
        amount: "",
        method: "",
        accountDetails: "",
      })

      // Refresh user data
      await refreshUser()
      
      // Force reload balance
      setTimeout(() => refreshUser(), 500)

    } catch (error: any) {
      console.error('Withdrawal error:', error)
      toast.error(error.message || "Withdrawal request failed. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  // ✅ Balance restore function
  const restoreBalance = async () => {
    if (!user) return
    
    try {
      toast.loading("Checking balance...")
      
      // Get the last successful withdrawal
      const { data: lastWithdrawal } = await supabase
        .from('withdrawals')
        .select('amount')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .order('processed_at', { ascending: false })
        .limit(1)
        .single()
        
      if (lastWithdrawal) {
        // Restore balance by adding back the withdrawn amount
        const currentBalance = user.wallet_balance || 0
        const restoredBalance = currentBalance + lastWithdrawal.amount
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ wallet_balance: restoredBalance })
          .eq('id', user.id)
          
        if (updateError) throw updateError
        
        toast.success("Balance restored from last withdrawal!")
        await refreshUser()
      } else {
        toast.dismiss()
        toast.info("No withdrawal found to restore from")
      }
    } catch (error) {
      console.error('Restore balance error:', error)
      toast.error("Failed to restore balance")
    }
  }

  if (!user) return null

  const walletBalanceXAF = user.wallet_balance || 0

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5 text-green-400" />
          <span>Withdraw Funds</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Withdrawal Rules */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4">
            <h4 className="text-amber-400 font-semibold mb-2">Withdrawal Rules</h4>
            <div className="text-sm text-amber-200/80 space-y-1">
              {isSpecialUser ? (
                <>
                  <p>• <strong>Instant Withdrawals:</strong> Your withdrawals are approved immediately</p>
                  <p>• <strong>No Waiting Period:</strong> Withdraw anytime</p>
                  <p>• <strong>Minimum Amount:</strong> {minWithdrawalXAF.toLocaleString()} XAF</p>
                  <p>• <strong>Processing Time:</strong> Instant</p>
                </>
              ) : (
                <>
                  <p>• <strong>New Users:</strong> Must wait 1 month after registration before first withdrawal</p>
                  <p>• <strong>Regular Users:</strong> Can withdraw weekly after first successful withdrawal</p>
                  <p>• <strong>Processing Time:</strong> 24-48 hours for all payment methods</p>
                  <p>• <strong>Minimum Amount:</strong> {minWithdrawalXAF.toLocaleString()} XAF</p>
                </>
              )}
            </div>
          </div>

          {/* Available Balance */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">Available Balance</div>
            <div className="text-2xl font-bold text-green-400">
              {walletBalanceXAF.toLocaleString()} XAF
            </div>
            {isSpecialUser && walletBalanceXAF === 0 && (
              <button
                onClick={restoreBalance}
                className="mt-2 text-xs text-red-400 hover:text-red-300"
              >
                ↻ Restore balance if lost
              </button>
            )}
          </div>

          {/* Withdrawal Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount (XAF)</Label>
            <Input
              id="amount"
              type="number"
              value={withdrawalData.amount}
              onChange={(e) => setWithdrawalData({ ...withdrawalData, amount: e.target.value })}
              placeholder="0"
              min={minWithdrawalXAF}
              max={walletBalanceXAF}
              className="bg-slate-800 border-slate-700 focus:border-green-500"
            />
            <div className="text-xs text-slate-400">
              Minimum: {minWithdrawalXAF.toLocaleString()} XAF • Max: {walletBalanceXAF.toLocaleString()} XAF
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select
              value={withdrawalData.method}
              onValueChange={(value: string) => setWithdrawalData({ ...withdrawalData, method: value })}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 focus:border-green-500">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    <div className="flex items-center space-x-2">
                      <method.icon className="h-4 w-4" />
                      <span>{method.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Account Details */}
          <div className="space-y-2">
            <Label htmlFor="accountDetails">Account Details</Label>
            <Textarea
              id="accountDetails"
              value={withdrawalData.accountDetails}
              onChange={(e) => setWithdrawalData({ ...withdrawalData, accountDetails: e.target.value })}
              placeholder="Enter your account details (account number, mobile money number, PayPal email, etc.)"
              className="bg-slate-800 border-slate-700 focus:border-green-500 min-h-[80px]"
            />
          </div>

          {/* Withdrawal Button */}
          <Button
            onClick={handleWithdrawal}
            disabled={
              processing ||
              !withdrawalData.amount ||
              !withdrawalData.method ||
              !withdrawalData.accountDetails ||
              Number.parseFloat(withdrawalData.amount) < minWithdrawalXAF ||
              Number.parseFloat(withdrawalData.amount) > walletBalanceXAF ||
              (!isSpecialUser && !canWithdraw)
            }
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            {processing ? (
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
          </Button>

          {/* Status Messages */}
          {!isSpecialUser && !canWithdraw && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm text-center">
                As a new user you need to make at least one month in the app to be able to submit your info for verifications before your first withdrawal
              </p>
            </div>
          )}

          {isSpecialUser && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-green-400 text-sm text-center">
                ⚡ Instant withdrawals approved for your account
              </p>
            </div>
          )}

          {/* Additional Info */}
          <div className="text-xs text-slate-400 space-y-1">
            <p>• All withdrawals are processed securely</p>
            <p>• Minimum withdrawal amount is {minWithdrawalXAF.toLocaleString()} XAF</p>
            <p>• Processing fees may apply depending on payment method</p>
            {isSpecialUser && (
              <p className="text-green-400">• Your withdrawals are processed instantly</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}