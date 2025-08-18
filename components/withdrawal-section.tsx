"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CreditCard, Banknote, Smartphone } from "lucide-react"
import { toast } from "sonner"

export function WithdrawalSection() {
  const { user, refreshUser } = useAuth()
  const [withdrawalData, setWithdrawalData] = useState({
    amount: "",
    method: "",
    accountDetails: "",
  })
  const [processing, setProcessing] = useState(false)

  const paymentMethods = [
    { value: "bank", label: "Bank Transfer", icon: CreditCard },
    { value: "mobile_money_mtn", label: "MTN Mobile Money", icon: Smartphone },
    { value: "mobile_money_orange", label: "Orange Money", icon: Smartphone },
    { value: "paypal", label: "PayPal", icon: Banknote },
  ]

  const handleWithdrawal = async () => {
    if (!user || !withdrawalData.amount || !withdrawalData.method) {
      toast.error("Please fill in all required fields")
      return
    }

    const amount = Number.parseFloat(withdrawalData.amount)
    const userWalletBalance = user.wallet_balance ?? 0
    if (amount <= 0 || amount > userWalletBalance) {
      toast.error("Invalid amount or insufficient balance")
      return
    }

    if (amount < 5) {
      toast.error("Minimum withdrawal amount is $5.00")
      return
    }

    setProcessing(true)

    try {
      const updatedUser = { ...user }
      updatedUser.wallet_balance = (updatedUser.wallet_balance ?? 0) - amount

      localStorage.setItem("easy_dollars_user", JSON.stringify(updatedUser))
      refreshUser()

      toast.success(`Withdrawal request of $${amount.toFixed(2)} submitted successfully!`)
      setWithdrawalData({ amount: "", method: "", accountDetails: "" })
    } catch (error) {
      toast.error("Withdrawal request failed. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  if (!user) return null

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
                • <strong>Minimum Amount:</strong> $5.00 per withdrawal
              </p>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-1">Available Balance</div>
            <div className="text-2xl font-bold text-green-400">${(user?.wallet_balance ?? 0).toFixed(2)}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount</Label>
            <Input
              id="amount"
              type="number"
              value={withdrawalData.amount}
              onChange={(e) => setWithdrawalData({ ...withdrawalData, amount: e.target.value })}
              placeholder="0.00"
              min="5"
              max={user.wallet_balance ?? 0}
              className="bg-slate-800 border-slate-700 focus:border-green-500"
            />
            <div className="text-xs text-slate-400">Minimum: $5.00</div>
          </div>

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

          <Button
            onClick={handleWithdrawal}
            disabled={
              processing ||
              !withdrawalData.amount ||
              !withdrawalData.method ||
              !withdrawalData.accountDetails ||
              Number.parseFloat(withdrawalData.amount) < 5 ||
              Number.parseFloat(withdrawalData.amount) > (user.wallet_balance ?? 0)
            }
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            {processing ? "Processing..." : "Request Withdrawal"}
          </Button>

          <div className="text-xs text-slate-400 space-y-1">
            <p>
              • <strong>New users:</strong> First withdrawal available after 1 month of registration
            </p>
            <p>
              • <strong>Regular users:</strong> Weekly withdrawals available after first successful withdrawal
            </p>
            <p>• Withdrawals are processed within 24-48 hours</p>
            <p>• Minimum withdrawal amount is $5.00</p>
            <p>• Processing fees may apply depending on payment method</p>
            <p>• Account verification required for first withdrawal</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
