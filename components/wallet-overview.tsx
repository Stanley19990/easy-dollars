"use client"

import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, DollarSign, Coins, TrendingUp } from "lucide-react"

export function WalletOverview() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">Wallet Balance</CardTitle>
          <Wallet className="h-4 w-4 text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-400">${ (user.wallet_balance ?? 0).toFixed(2) }
</div>
          <p className="text-xs text-slate-500 mt-1">Available for withdrawal</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">ED Balance</CardTitle>
          <Coins className="h-4 w-4 text-cyan-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-cyan-400">{(user.ed_balance ?? 0).toFixed(2)} ED
</div>
          <p className="text-xs text-slate-500 mt-1">Easy Dollars tokens</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">Total Earned</CardTitle>
          <TrendingUp className="h-4 w-4 text-amber-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-400">${(user.total_earned ?? 0).toFixed(2)}
</div>
          <p className="text-xs text-slate-500 mt-1">Lifetime earnings</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">Machines Owned</CardTitle>
          <DollarSign className="h-4 w-4 text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-400">{user.machines_owned}</div>
          <p className="text-xs text-slate-500 mt-1">Active machines</p>
        </CardContent>
      </Card>
    </div>
  )
}
