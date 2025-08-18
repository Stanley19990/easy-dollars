"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, DollarSign, Calendar } from "lucide-react"

// Mock referral data - replace with real data when database is connected
const referrals = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    joinDate: "2024-01-15T10:30:00Z",
    status: "active",
    earned: 5.0,
    totalSpent: 25.0,
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    joinDate: "2024-01-14T14:20:00Z",
    status: "active",
    earned: 5.0,
    totalSpent: 50.0,
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike@example.com",
    joinDate: "2024-01-13T09:15:00Z",
    status: "pending",
    earned: 0.0,
    totalSpent: 0.0,
  },
]

export function ReferralHistory() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      case "inactive":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-slate-400" />
          <span>Referral History</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {referrals.map((referral) => (
            <div
              key={referral.id}
              className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-700 rounded-lg">
                  <Users className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <div className="font-medium text-white">{referral.name}</div>
                  <div className="text-sm text-slate-400">{referral.email}</div>
                  <div className="flex items-center space-x-1 text-xs text-slate-500 mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>Joined {formatDate(referral.joinDate)}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center space-x-2 mb-1">
                  <DollarSign className="h-4 w-4 text-green-400" />
                  <span className="font-semibold text-green-400">${referral.earned.toFixed(2)}</span>
                </div>
                <Badge variant="secondary" className={getStatusColor(referral.status)}>
                  {referral.status}
                </Badge>
                <div className="text-xs text-slate-500 mt-1">Spent: ${referral.totalSpent.toFixed(2)}</div>
              </div>
            </div>
          ))}

          {referrals.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No referrals yet</p>
              <p className="text-sm">Start sharing your referral link to earn bonuses!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
