"use client"

import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, DollarSign, Coins, TrendingUp, Info } from "lucide-react"

export function WalletBalance({ wallet }: { wallet: number }) {
  const { user } = useAuth()

  if (!user) return null

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wallet className="h-5 w-5 text-green-400" />
          <span className="text-white">Wallet Overview</span>
        </CardTitle>
        <p className="text-slate-300 text-sm">
          Your Easy Dollars wallet supports two currencies: USD for real money and ED tokens for earnings from ad
          watching.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* USD Balance */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                <span className="text-sm font-medium text-green-300">USD Balance</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-green-400 mb-2">${(wallet ?? 0).toFixed(2)}</div>
            <p className="text-xs text-green-200/70">Available for withdrawals</p>
          </div>

          {/* ED Balance */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Coins className="h-5 w-5 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-300">ED Balance</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-cyan-400 mb-2">{(user.ed_balance ?? 0).toFixed(2)} ED</div>
            <p className="text-xs text-cyan-200/70">Earned from watching ads • Convert to USD anytime</p>
          </div>
        </div>

        {/* Total Earnings */}
        <div className="mt-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-medium text-amber-300">Total Lifetime Earnings</span>
            </div>
            <div className="text-2xl font-bold text-amber-400">${(user.total_earned ?? 0).toFixed(2)}</div>
          </div>
          <div className="mt-2 text-xs text-amber-200/70">
            From {user.machines_owned ?? 0} machines and ad watching sessions
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mt-6 bg-slate-800/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Info className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-semibold text-cyan-300">How Your Wallet Works</span>
          </div>
          <div className="space-y-2 text-xs text-slate-300">
            <p>
              <strong className="text-green-400">USD Balance:</strong> Real money for withdrawals
            </p>
            <p>
              <strong className="text-cyan-400">ED Tokens:</strong> Earned from ad watching • 1 ED = $0.10 USD
            </p>
            <p>
              <strong className="text-purple-400">Withdrawals:</strong> Minimum $5.00 • Processed within 24-48 hours
            </p>
            <p>
              <strong className="text-blue-400">First Withdrawal:</strong> Requires account verification for security
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}