"use client"

import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, DollarSign, Coins, TrendingUp, RefreshCw } from "lucide-react"
import { useState } from "react"

export function WalletOverview() {
  const { user, refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)

  if (!user) return null

  const handleRefresh = async () => {
    setLoading(true)
    await refreshUser()
    setLoading(false)
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Wallet Balance */}
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">Wallet Balance</CardTitle>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-green-400" />
            <RefreshCw className="h-4 w-4 text-slate-400 cursor-pointer" onClick={handleRefresh} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-400">${(user.wallet_balance ?? 0).toFixed(2)}</div>
          <p className="text-xs text-slate-500 mt-1">Available for withdrawal</p>
        </CardContent>
      </Card>

      {/* ED Balance */}
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">ED Balance</CardTitle>
          <Coins className="h-4 w-4 text-cyan-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-cyan-400">{(user.ed_balance ?? 0).toFixed(2)} ED</div>
          <p className="text-xs text-slate-500 mt-1">Easy Dollars tokens</p>
        </CardContent>
      </Card>

      {/* Total Earned */}
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader className="flex items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">Total Earned</CardTitle>
          <TrendingUp className="h-4 w-4 text-amber-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-400">${(user.total_earned ?? 0).toFixed(2)}</div>
          <p className="text-xs text-slate-500 mt-1">Lifetime earnings</p>
        </CardContent>
      </Card>

      {/* Machines Owned */}
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader className="flex items-center justify-between pb-2">
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
