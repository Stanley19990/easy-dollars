"use client"

import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, DollarSign, TrendingUp, Gift } from "lucide-react"

export function ReferralOverview() {
  const { user } = useAuth()

  // Mock referral data - replace with real data when database is connected
  const referralStats = {
    totalReferrals: 12,
    activeReferrals: 8,
    totalEarned: 60.0,
    pendingRewards: 15.0,
  }

  if (!user) return null

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-purple-400" />
          <span>Referral Overview</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">Total Referrals</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">{referralStats.totalReferrals}</div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">Active</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{referralStats.activeReferrals}</div>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">Total Earned</span>
            </div>
            <div className="text-2xl font-bold text-amber-400">${referralStats.totalEarned.toFixed(2)}</div>
          </div>

          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Gift className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">Pending</span>
            </div>
            <div className="text-2xl font-bold text-cyan-400">${referralStats.pendingRewards.toFixed(2)}</div>
          </div>
        </div>

        <div className="mt-6 bg-slate-800/50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">How it works:</h3>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>• Share your referral link with friends</li>
            <li>• Earn $5 when they sign up and make their first purchase</li>
            <li>• Get additional bonuses when they reach milestones</li>
            <li>• No limit on referrals - invite as many as you want!</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
