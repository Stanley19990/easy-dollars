"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History, ArrowUpRight, ArrowDownLeft, Coins, CreditCard, Plus } from "lucide-react"

interface TransactionHistoryProps {
  transactions: {
    id: string
    type: string
    description: string
    amount: number
    currency: string
    status: string
    created_at: string
  }[]
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "earning":
        return <Coins className="h-4 w-4 text-green-400" />
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4 text-red-400" />
      case "conversion":
        return <ArrowDownLeft className="h-4 w-4 text-purple-400" />
      case "purchase":
        return <CreditCard className="h-4 w-4 text-blue-400" />
      case "deposit":
        return <Plus className="h-4 w-4 text-cyan-400" />
      default:
        return <History className="h-4 w-4 text-slate-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-300 border-green-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-300 border-yellow-500/20"
      case "failed":
        return "bg-red-500/10 text-red-300 border-red-500/20"
      default:
        return "bg-slate-500/10 text-slate-300 border-slate-500/20"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <History className="h-5 w-5 text-slate-300" />
          <span className="text-white">Transaction History</span>
        </CardTitle>
        <p className="text-slate-300 text-sm">
          Track all your deposits, earnings, conversions, and withdrawals
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-700 rounded-lg">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <div className="font-medium text-white">{transaction.description}</div>
                    <div className="text-sm text-slate-300">{formatDate(transaction.created_at)}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`font-semibold ${
                        transaction.type === "earning" ||
                        transaction.type === "conversion" ||
                        transaction.type === "deposit"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {transaction.type === "earning" ||
                      transaction.type === "conversion" ||
                      transaction.type === "deposit"
                        ? "+"
                        : "-"}
                      {transaction.amount.toFixed(2)} {transaction.currency}
                    </span>
                  </div>
                  <Badge variant="secondary" className={getStatusColor(transaction.status)}>
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-slate-300">No transactions yet</p>
              <p className="text-sm text-slate-400">Your transaction history will appear here</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
