"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, Download, TrendingUp, DollarSign, Smartphone } from "lucide-react"
import { authService } from "@/lib/auth"
import { toast } from "sonner"

interface AdminWalletData {
  balance: number
  totalReceived: number
  totalWithdrawn: number
}

interface Transaction {
  id: string
  amount: number
  transaction_type: string
  description: string
  status: string
  withdrawal_method?: string
  created_at: string
}

export function AdminWallet() {
  const [walletData, setWalletData] = useState<AdminWalletData>({ balance: 0, totalReceived: 0, totalWithdrawn: 0 })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [withdrawing, setWithdrawing] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState("")
  const [withdrawalMethod, setWithdrawalMethod] = useState("mtn")
  const [phoneNumber, setPhoneNumber] = useState("")

  useEffect(() => {
    loadWalletData()
    loadTransactions()
  }, [])

  const loadWalletData = async () => {
    try {
      const data = await authService.getAdminWallet()
      setWalletData(data)
    } catch (error) {
      console.error("Failed to load admin wallet:", error)
    }
  }

  const loadTransactions = async () => {
    try {
      const data = await authService.getAdminTransactions()
      setTransactions(data)
    } catch (error) {
      console.error("Failed to load admin transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    const amount = Number.parseFloat(withdrawalAmount)

    if (!amount || amount <= 0) {
      toast.error("Please enter a valid withdrawal amount")
      return
    }

    if (amount > walletData.balance) {
      toast.error("Insufficient balance for withdrawal")
      return
    }

    if (!phoneNumber && (withdrawalMethod === "mtn" || withdrawalMethod === "orange")) {
      toast.error("Please enter your phone number")
      return
    }

    setWithdrawing(true)

    try {
      const withdrawalDetails = {
        phoneNumber: withdrawalMethod === "mtn" || withdrawalMethod === "orange" ? phoneNumber : null,
        method: withdrawalMethod,
      }

      const result = await authService.adminWithdraw(amount, withdrawalMethod.toUpperCase(), withdrawalDetails)

      if (result.success) {
        toast.success(
          `Withdrawal of $${amount.toFixed(2)} via ${withdrawalMethod.toUpperCase()} initiated successfully!`,
        )
        setShowWithdrawModal(false)
        setWithdrawalAmount("")
        setPhoneNumber("")
        loadWalletData()
        loadTransactions()
      } else {
        toast.error(result.error || "Withdrawal failed")
      }
    } catch (error) {
      toast.error("An error occurred during withdrawal")
    } finally {
      setWithdrawing(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-green-400" />
            <span>Admin Wallet</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-green-400" />
            <span>Admin Wallet</span>
          </CardTitle>
          <p className="text-slate-400 text-sm">Funds from machine purchases are automatically transferred here</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Wallet Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-green-400 font-medium">Available Balance</span>
                </div>
                <div className="text-2xl font-bold text-green-400">${walletData.balance.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-blue-400 font-medium">Total Received</span>
                </div>
                <div className="text-2xl font-bold text-blue-400">${walletData.totalReceived.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Download className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-purple-400 font-medium">Total Withdrawn</span>
                </div>
                <div className="text-2xl font-bold text-purple-400">${walletData.totalWithdrawn.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Withdrawal Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => setShowWithdrawModal(true)}
              disabled={walletData.balance <= 0}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 font-semibold px-8"
            >
              <Download className="h-4 w-4 mr-2" />
              Withdraw Funds
            </Button>
          </div>

          {/* Recent Transactions */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transactions.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No transactions yet</p>
              ) : (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-full ${
                          transaction.transaction_type === "credit"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {transaction.transaction_type === "credit" ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{transaction.description}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-bold ${
                          transaction.transaction_type === "credit" ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {transaction.transaction_type === "credit" ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-900 border-slate-700 w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-green-400">Withdraw Funds</CardTitle>
              <p className="text-slate-400 text-sm">Available balance: ${walletData.balance.toFixed(2)}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Withdrawal Amount ($)</label>
                <input
                  type="number"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  max={walletData.balance}
                  min="1"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Withdrawal Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setWithdrawalMethod("mtn")}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      withdrawalMethod === "mtn"
                        ? "border-orange-500 bg-orange-500/10 text-orange-400"
                        : "border-slate-700 bg-slate-800 text-slate-300"
                    }`}
                  >
                    <Smartphone className="h-5 w-5 mx-auto mb-1" />
                    <div className="text-sm font-medium">MTN Money</div>
                  </button>
                  <button
                    onClick={() => setWithdrawalMethod("orange")}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      withdrawalMethod === "orange"
                        ? "border-orange-600 bg-orange-600/10 text-orange-400"
                        : "border-slate-700 bg-slate-800 text-slate-300"
                    }`}
                  >
                    <Smartphone className="h-5 w-5 mx-auto mb-1" />
                    <div className="text-sm font-medium">Orange Money</div>
                  </button>
                </div>
              </div>

              {(withdrawalMethod === "mtn" || withdrawalMethod === "orange") && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={() => setShowWithdrawModal(false)}
                  variant="outline"
                  className="flex-1"
                  disabled={withdrawing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  {withdrawing ? "Processing..." : "Withdraw"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
