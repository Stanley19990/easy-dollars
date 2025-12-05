// components/wallet-balance.tsx - UPDATED WITH REAL-TIME BALANCE TRACKING
"use client"

import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, DollarSign, Coins, TrendingUp, Info, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface WalletStats {
  total_machines: number
  active_machines: number
  total_daily_earnings: number
  total_earned_xaf: number
  total_withdrawals: number
}

interface DatabaseUser {
  id: string
  wallet_balance: number
  ed_balance: number
  total_earned: number
}

export function WalletBalance({ wallet: initialWallet }: { wallet: number }) {
  const { user: authUser, refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [walletBalance, setWalletBalance] = useState(initialWallet)
  const [totalEarned, setTotalEarned] = useState(0)
  const [edBalance, setEdBalance] = useState(0)
  const [stats, setStats] = useState<WalletStats>({
    total_machines: 0,
    active_machines: 0,
    total_daily_earnings: 0,
    total_earned_xaf: 0,
    total_withdrawals: 0
  })

  const user = authUser as unknown as DatabaseUser

  // ✅ UPDATED: Real-time balance subscription
  useEffect(() => {
    if (!user) return
    setWalletBalance(initialWallet)

    const channel = supabase
      .channel('wallet-balance-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('💰 Real-time balance update:', payload)
          const newData = payload.new as DatabaseUser
          setWalletBalance(newData.wallet_balance || 0)
          setTotalEarned(newData.total_earned || 0)
          setEdBalance(newData.ed_balance || 0)
          toast.success('Balance updated!')
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, initialWallet])

  const fetchWalletStats = async () => {
    if (!user) return
    setLoading(true)

    try {
      // Fetch latest balance from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('wallet_balance, total_earned, ed_balance')
        .eq('id', user.id)
        .single()

      if (!userError && userData) {
        setWalletBalance(userData.wallet_balance || 0)
        setTotalEarned(userData.total_earned || 0)
        setEdBalance(userData.ed_balance || 0)
      }

      // Fetch total machines count
      const { count: totalMachines } = await supabase
        .from('user_machines')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // Fetch active machines count
      const { count: activeMachines } = await supabase
        .from('user_machines')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true)

      // Fetch total daily earnings
      const { data: userMachines } = await supabase
        .from('user_machines')
        .select(`
          machine_types (
            daily_earnings
          )
        `)
        .eq('user_id', user.id)

      let totalDailyEarnings = 0
      userMachines?.forEach(machine => {
        const machineData = Array.isArray(machine.machine_types)
          ? machine.machine_types[0]
          : machine.machine_types
        totalDailyEarnings += machineData?.daily_earnings || 0
      })

      // Fetch total withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('amount')
        .eq('user_id', user.id)
        .eq('status', 'completed')

      const totalWithdrawals = withdrawals?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0

      setStats({
        total_machines: totalMachines || 0,
        active_machines: activeMachines || 0,
        total_daily_earnings: totalDailyEarnings,
        total_earned_xaf: totalEarned,
        total_withdrawals: totalWithdrawals
      })

    } catch (error) {
      console.error('Error fetching wallet stats:', error)
      toast.error('Failed to load wallet statistics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWalletStats()
  }, [user])

  const handleRefresh = async () => {
    await refreshUser()
    await fetchWalletStats()
    toast.success('Wallet data updated!')
  }

  if (!user) return null

  const edToXAF = edBalance * 60
  const netEarningsXAF = totalEarned - stats.total_withdrawals

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-green-400" />
            <span className="text-white">Wallet Overview</span>
          </div>
          <RefreshCw
            className={`h-4 w-4 text-cyan-400 cursor-pointer ${loading ? 'animate-spin' : ''}`}
            onClick={handleRefresh}
          />
        </CardTitle>
        <p className="text-slate-300 text-sm">
          Your Easy Dollars wallet supports two currencies: XAF for real money and ED tokens for earnings from machines and ad watching.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* XAF Balance */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                <span className="text-sm font-medium text-green-300">Available Balance</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-green-400 mb-2">
              {walletBalance.toLocaleString()} XAF
            </div>
            <p className="text-xs text-green-200/70">
              Available for withdrawals • Min: 3,000 XAF
            </p>
          </div>

          {/* ED Balance */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Coins className="h-5 w-5 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-300">ED Balance</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-cyan-400 mb-2">
              {edBalance.toFixed(2)} ED
            </div>
            <p className="text-xs text-cyan-200/70">
              ≈ {edToXAF.toLocaleString()} XAF • Earned from machines & ads
            </p>
          </div>
        </div>

        {/* Earnings Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Total Lifetime Earnings */}
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-300">Total Earned</span>
            </div>
            <div className="text-xl font-bold text-amber-400">
              {totalEarned.toLocaleString()} XAF
            </div>
            <p className="text-xs text-amber-200/70 mt-1">Lifetime earnings</p>
          </div>

          {/* Net Earnings */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
            <div className="text-sm font-medium text-purple-300 mb-2">Net Earnings</div>
            <div className="text-xl font-bold text-purple-400">
              {netEarningsXAF.toLocaleString()} XAF
            </div>
            <p className="text-xs text-purple-200/70 mt-1">After withdrawals</p>
          </div>

          {/* Daily Potential */}
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-300 mb-2">Daily Potential</div>
            <div className="text-xl font-bold text-blue-400">
              {stats.total_daily_earnings.toLocaleString()} XAF
            </div>
            <p className="text-xs text-blue-200/70 mt-1">
              From {stats.total_machines} machines
            </p>
          </div>
        </div>

        {/* Machine Stats */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-slate-800/30 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-cyan-400">{stats.total_machines}</div>
            <div className="text-xs text-slate-400">Total Machines</div>
          </div>
          <div className="bg-slate-800/30 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-green-400">{stats.active_machines}</div>
            <div className="text-xs text-slate-400">Active Machines</div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mt-6 bg-slate-800/30 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Info className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-semibold text-cyan-300">How Your Wallet Works</span>
          </div>
          <div className="text-xs text-slate-400 space-y-2">
            <p>• <strong>XAF (CFA Franc):</strong> Real money you can withdraw</p>
            <p>• <strong>ED (Easy Dollars):</strong> Tokens earned from machines (1 ED = 60 XAF)</p>
            <p>• Convert ED to XAF anytime using the converter</p>
            <p>• Minimum withdrawal: 3,000 XAF</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}