"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Check, X } from "lucide-react"

// Mock withdrawal data - replace with real data when database is connected
const withdrawals = [
  {
    id: "1",
    user: "John Doe",
    amount: 50.0,
    method: "Bank Transfer",
    status: "pending",
    requestDate: "2024-01-15",
  },
  {
    id: "2",
    user: "Jane Smith",
    amount: 25.0,
    method: "Mobile Money",
    status: "pending",
    requestDate: "2024-01-14",
  },
  {
    id: "3",
    user: "Mike Johnson",
    amount: 100.0,
    method: "PayPal",
    status: "completed",
    requestDate: "2024-01-13",
  },
]

export function WithdrawalManagement() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      case "rejected":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20"
    }
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5 text-green-400" />
          <span>Withdrawal Management</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {withdrawals.map((withdrawal) => (
            <div
              key={withdrawal.id}
              className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
            >
              <div className="flex-1">
                <div className="font-medium text-white">{withdrawal.user}</div>
                <div className="text-sm text-slate-400">{withdrawal.method}</div>
                <div className="text-xs text-slate-500 mt-1">Requested {withdrawal.requestDate}</div>
              </div>

              <div className="text-right mr-4">
                <div className="text-lg font-bold text-green-400">${withdrawal.amount.toFixed(2)}</div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className={getStatusColor(withdrawal.status)}>
                  {withdrawal.status}
                </Badge>
                {withdrawal.status === "pending" && (
                  <div className="flex space-x-1">
                    <Button size="icon" className="h-8 w-8 bg-green-500 hover:bg-green-600">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" className="h-8 w-8">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
