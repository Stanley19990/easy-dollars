// components/withdrawal-section.tsx
"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CreditCard, Banknote, Smartphone, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

// Extended user type to include database fields
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
  const [minWithdrawalXAF] = useState(3000) // 3000 XAF minimum

  // Type assertion to handle the user type mismatch
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

  const handleWithdrawal = async () => {
    if (!user || !withdrawalData.amount || !withdrawalData.method || !withdrawalData.accountDetails) {
      toast.error("Please fill in all required fields")
      return
    }

    const amountXAF = Number.parseFloat(withdrawalData.amount)
    const userWalletBalanceXAF = user.wallet_balance || 0

    if (amountXAF <= 0 || amountXAF > userWalletBalanceXAF) {
      toast.error("Invalid amount or insufficient balance")
      return
    }

    if (amountXAF < minWithdrawalXAF) {
      toast.error(`Minimum withdrawal amount is ${minWithdrawalXAF.toLocaleString()} XAF`)
      return
    }

    if (!canWithdraw) {
      toast.error("Withdrawals are available after 1 month of registration")
      return
    }

    setProcessing(true)

    try {
      // Create withdrawal request in database
      const { error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount: amountXAF,
          method: withdrawalData.method,
          account_details: withdrawalData.accountDetails,
          status: 'pending'
        })

      if (error) throw error

      toast.success(`Withdrawal request of ${amountXAF.toLocaleString()} XAF submitted successfully!`)
      setWithdrawalData({ amount: "", method: "", accountDetails: "" })
      
      // Refresh user data
      await refreshUser()
    } catch (error) {
      console.error('Withdrawal error:', error)
      toast.error("Withdrawal request failed. Please try again.")
    } finally {
      setProcessing(false)
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
              <p>
                • <strong>New Users:</strong> Must wait 1 month after registration before first withdrawal
              </p>
              <p>
                • <strong>Regular Users:</strong> Can withdraw weekly after first successful withdrawal
              </p>
              <p>
                • <strong>Processing Time:</strong> 24-48 hours for all payment methods
              </p>
              <p>
                • <strong>Minimum Amount:</strong> {minWithdrawalXAF.toLocaleString()} XAF
              </p>
            </div>
          </div>

          {/* Available Balance */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">Available Balance</div>
            <div className="text-2xl font-bold text-green-400">
              {walletBalanceXAF.toLocaleString()} XAF
            </div>
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
              Minimum: {minWithdrawalXAF.toLocaleString()} XAF
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
              !canWithdraw
            }
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            {processing ? "Processing..." : canWithdraw ? "Request Withdrawal" : "Withdrawal Locked"}
          </Button>

          {/* Status Message */}
          {!canWithdraw && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm text-center">
                Withdrawals will be available after your first month of registration
              </p>
            </div>
          )}

          {/* Additional Info */}
          <div className="text-xs text-slate-400 space-y-1">
            <p>
              • <strong>New users:</strong> First withdrawal available after 1 month of registration
            </p>
            <p>
              • <strong>Regular users:</strong> Weekly withdrawals available after first successful withdrawal
            </p>
            <p>• Withdrawals are processed within 24-48 hours</p>
            <p>• Minimum withdrawal amount is {minWithdrawalXAF.toLocaleString()} XAF</p>
            <p>• Processing fees may apply depending on payment method</p>
            <p>• Account verification required for first withdrawal</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}