"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, DollarSign, Zap, TrendingUp } from "lucide-react"

export function AdminStats() {
  // Mock admin stats - replace with real data when database is connected
  const stats = {
    totalUsers: 1247,
    totalRevenue: 15420.75,
    activeMachines: 3891,
    pendingWithdrawals: 2340.5,
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
          <Users className="h-4 w-4 text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-400">{stats.totalUsers.toLocaleString()}</div>
          <p className="text-xs text-slate-500 mt-1">+12% from last month</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-400">${stats.totalRevenue.toLocaleString()}</div>
          <p className="text-xs text-slate-500 mt-1">+8% from last month</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">Active Machines</CardTitle>
          <Zap className="h-4 w-4 text-cyan-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-cyan-400">{stats.activeMachines.toLocaleString()}</div>
          <p className="text-xs text-slate-500 mt-1">+15% from last month</p>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">Pending Withdrawals</CardTitle>
          <TrendingUp className="h-4 w-4 text-amber-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-400">${stats.pendingWithdrawals.toLocaleString()}</div>
          <p className="text-xs text-slate-500 mt-1">23 requests pending</p>
        </CardContent>
      </Card>
    </div>
  )
}
