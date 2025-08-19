"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { CreditCard, Smartphone, Banknote, ArrowRight, Shield, Clock } from "lucide-react"
import { toast } from "sonner"

interface DepositModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DepositModal({ open, onOpenChange }: DepositModalProps) {
  const { user, refreshUser } = useAuth()
  const [step, setStep] = useState<"method" | "details" | "confirmation">("method")
  const [depositData, setDepositData] = useState({
    amount: "",
    method: "",
    accountDetails: "",
    phoneNumber: "",
    email: "",
  })
  const [processing, setProcessing] = useState(false)

  const paymentMethods = [
    {
      value: "mtn_mobile_money",
      label: "MTN Mobile Money",
      icon: Smartphone,
      description: "Instant deposits via MTN MoMo",
      fees: "2.5% + $0.50",
    },
    {
      value: "orange_money",
      label: "Orange Money",
      icon: Smartphone,
      description: "Quick deposits via Orange Money",
      fees: "2.5% + $0.50",
    },
    {
      value: "paypal",
      label: "PayPal",
      icon: Banknote,
      description: "Secure international payments",
      fees: "3.5% + $0.30",
    },
  ]

  const selectedMethod = paymentMethods.find((m) => m.value === depositData.method)

  const handleMethodSelect = (method: string) => {
    setDepositData({ ...depositData, method })
    setStep("details")
  }

  const handleDeposit = async () => {
    if (!user || !depositData.amount || !depositData.method) {
      toast.error("Please fill in all required fields")
      return
    }

    const amount = Number.parseFloat(depositData.amount)
    if (amount < 5) {
      toast.error("Minimum deposit amount is $5.00")
      return
    }

    setProcessing(true)

    try {
      // Mock deposit processing - in real app, this would call payment API
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const updatedUser = { ...user }
      updatedUser.wallet_balance = (updatedUser.wallet_balance ?? 0) + amount

      localStorage.setItem("easy_dollars_user", JSON.stringify(updatedUser))
      refreshUser()

      toast.success(`Deposit of $${amount.toFixed(2)} completed successfully!`)
      setDepositData({ amount: "", method: "", accountDetails: "", phoneNumber: "", email: "" })
      setStep("method")
      onOpenChange(false)
    } catch (error) {
      toast.error("Deposit failed. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  const resetModal = () => {
    setStep("method")
    setDepositData({ amount: "", method: "", accountDetails: "", phoneNumber: "", email: "" })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) resetModal()
      }}
    >
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-green-400" />
            <span>Add Funds to Wallet</span>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Choose your preferred payment method to add funds to your USD balance
          </DialogDescription>
        </DialogHeader>

        {step === "method" && (
          <div className="space-y-4">
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <Card
                  key={method.value}
                  className="bg-slate-800/50 border-slate-700 hover:border-green-500/30 cursor-pointer transition-colors"
                  onClick={() => handleMethodSelect(method.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-slate-700 rounded-lg">
                          <method.icon className="h-5 w-5 text-green-400" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{method.label}</div>
                          <div className="text-sm text-slate-400">{method.description}</div>
                          <div className="text-xs text-slate-500">Fees: {method.fees}</div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-slate-800/30 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-semibold text-cyan-300">Security & Processing</span>
              </div>
              <div className="space-y-1 text-xs text-slate-300">
                <p>• All payments are processed securely</p>
                <p>• Funds are added to your balance instantly</p>
                <p>• Minimum deposit: $5.00</p>
                <p>• Maximum deposit: $1,000.00 per transaction</p>
              </div>
            </div>
          </div>
        )}

        {step === "details" && selectedMethod && (
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <selectedMethod.icon className="h-5 w-5 text-green-400" />
                <div>
                  <div className="font-medium text-white">{selectedMethod.label}</div>
                  <div className="text-sm text-slate-400">{selectedMethod.description}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-slate-300">
                  Deposit Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={depositData.amount}
                  onChange={(e) => setDepositData({ ...depositData, amount: e.target.value })}
                  placeholder="0.00"
                  min="5"
                  max="1000"
                  className="bg-slate-800 border-slate-700 focus:border-green-500 text-white"
                />
                <div className="text-xs text-slate-400">
                  Fee: {selectedMethod.fees} • You'll receive: $
                  {depositData.amount
                    ? (
                        Number.parseFloat(depositData.amount) -
                        Number.parseFloat(depositData.amount) * 0.025 -
                        0.5
                      ).toFixed(2)
                    : "0.00"}
                </div>
              </div>

              {(depositData.method === "mtn_mobile_money" || depositData.method === "orange_money") && (
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-slate-300">
                    Mobile Money Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    value={depositData.phoneNumber}
                    onChange={(e) => setDepositData({ ...depositData, phoneNumber: e.target.value })}
                    placeholder="e.g., +237 6XX XXX XXX"
                    className="bg-slate-800 border-slate-700 focus:border-green-500 text-white"
                  />
                </div>
              )}

              {depositData.method === "paypal" && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">
                    PayPal Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={depositData.email}
                    onChange={(e) => setDepositData({ ...depositData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="bg-slate-800 border-slate-700 focus:border-green-500 text-white"
                  />
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={() => setStep("method")}
                variant="outline"
                className="flex-1 border-slate-700 text-slate-400 hover:text-white bg-transparent"
              >
                Back
              </Button>
              <Button
                onClick={handleDeposit}
                disabled={
                  processing ||
                  !depositData.amount ||
                  Number.parseFloat(depositData.amount) < 5 ||
                  (depositData.method !== "paypal" && !depositData.phoneNumber) ||
                  (depositData.method === "paypal" && !depositData.email)
                }
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                {processing ? "Processing..." : `Deposit $${depositData.amount || "0.00"}`}
              </Button>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-semibold text-amber-300">Processing Time</span>
              </div>
              <p className="text-xs text-amber-200/70">
                {depositData.method === "paypal"
                  ? "PayPal deposits are processed instantly"
                  : "Mobile money deposits are processed within 5-10 minutes"}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
