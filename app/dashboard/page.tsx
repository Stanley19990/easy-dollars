"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { WalletOverview } from "@/components/wallet-overview"
import { MachineMarketplace } from "@/components/machine-marketplace"
import { MyMachines } from "@/components/my-machines"
import { EarningsChart } from "@/components/earnings-chart"
import { FloatingParticles } from "@/components/floating-particles"
import { Toaster, toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

// Define types to fix TypeScript errors
interface ReferredUser {
  username: string;
  email: string;
}

interface Referral {
  id: number;
  referred_id: string;
  bonus: number;
  referral_date: string;
  referred_user: ReferredUser[];
}

interface MachineEstimate {
  name: string;
  earnings: number;
}

interface MiningMachine {
  isActive: boolean;
  lastClaim: string | null;
  activatedAt: string | null;
  dailyEarnings: number;
  name: string;
  image: string | null;
  canClaim: boolean;
  progress: number;
  hoursRemaining: number;
  timeRemaining: string;
}

export default function DashboardPage() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()

  const [referrals, setReferrals] = useState<Referral[]>([])
  const [todaysEarnings, setTodaysEarnings] = useState({
    totalEstimated: 0, 
    machineEstimates: [] as MachineEstimate[],
    machinesCount: 0
  })  
  const [earningsHistory, setEarningsHistory] = useState<any[]>([])
  const [calculatingEarnings, setCalculatingEarnings] = useState(false)
  
  // Mining system states
  const [miningMachines, setMiningMachines] = useState<Record<string, MiningMachine>>({})
  const [activatingMachine, setActivatingMachine] = useState<string | null>(null)
  const [claimingMachine, setClaimingMachine] = useState<string | null>(null)

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) router.push("/")
  }, [user, loading, router])

  // Fetch referrals with explicit foreign key relationships
  const fetchReferrals = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("referrals")
        .select(`
          id,
          referred_id,
          bonus,
          referral_date,
          referred_user:users!referrals_referred_id_fkey(username,email)
        `)
        .eq("referrer_id", user.id)
        .order("referral_date", { ascending: false })

      if (error) throw error
      setReferrals(data as Referral[] ?? [])
    } catch (err) {
      console.error("Referrals fetch error:", err)
      toast.error("Failed to load referrals")
    }
  }

  // Calculate today's earnings directly from database (no API needed)
  const calculateTodaysEarnings = async () => {
    if (!user) return

    try {
      const { data: userMachines, error } = await supabase
        .from('user_machines')
        .select(`
          machine_type_id,
          machine_types (
            daily_earnings,
            monthly_earnings,
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (error) throw error

      let totalEstimated = 0
      const machineEstimates: MachineEstimate[] = []

      userMachines?.forEach(um => {
        // Handle machine_types array properly
        const machineData = Array.isArray(um.machine_types) ? um.machine_types[0] : um.machine_types
        const dailyEarning = machineData?.daily_earnings || 0
        totalEstimated += dailyEarning
        machineEstimates.push({
          name: machineData?.name || 'Unknown Machine',
          earnings: dailyEarning
        })
      })

      setTodaysEarnings({
        totalEstimated,
        machineEstimates,
        machinesCount: machineEstimates.length
      })
    } catch (error) {
      console.error('Earnings calculation error:', error)
      setTodaysEarnings({
        totalEstimated: 0,
        machineEstimates: [],
        machinesCount: 0
      })
    }
  }

  // Manual earnings calculation
  const handleManualEarningsCalculation = async () => {
    if (!user) return
    setCalculatingEarnings(true)
    
    try {
      const { data: userMachines, error } = await supabase
        .from('user_machines')
        .select(`
          id,
          machine_type_id,
          machine_types (
            daily_earnings,
            monthly_earnings,
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (error) throw error

      if (!userMachines || userMachines.length === 0) {
        toast.info("No active machines to calculate earnings for")
        return
      }

      let totalEarnings = 0
      const earningsDetails = []

      // Calculate earnings for each machine
      for (const userMachine of userMachines) {
        const machineData = Array.isArray(userMachine.machine_types) 
          ? userMachine.machine_types[0] 
          : userMachine.machine_types
        
        const dailyEarning = machineData?.daily_earnings || 0
        totalEarnings += dailyEarning
        
        earningsDetails.push({
          machineId: userMachine.machine_type_id,
          machineName: machineData?.name || 'Unknown Machine',
          earnings: dailyEarning
        })

        // Record individual earning in earnings table
        await supabase
          .from('earnings')
          .insert({
            user_id: user.id,
            machine_id: userMachine.id,
            amount: dailyEarning,
            earned_at: new Date().toISOString(),
            type: 'daily_earnings'
          })
      }

      // Update user's ED balance and total earned
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          ed_balance: totalEarnings,
          total_earned: totalEarnings
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      toast.success(`💰 Earned ${totalEarnings} XAF from ${earningsDetails.length} machines!`)
      refreshDashboard()

    } catch (error) {
      console.error('Manual earnings error:', error)
      // FIX: Type-safe error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error('Failed to calculate earnings: ' + errorMessage)
    } finally {
      setCalculatingEarnings(false)
    }
  }

  const activateMachine = async (machineId: string) => {
    if (!user) return
    setActivatingMachine(machineId)
    
    try {
      const response = await fetch('/api/machines/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, machineId })
      })

      // Check if API route exists
      if (response.status === 404) {
        toast.error('Mining system not available yet. Please try again later.')
        return
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success('Machine activated! 🚀 Mining for 24 hours...')
        refreshDashboard()
      } else {
        toast.error('Failed to activate machine: ' + result.error)
      }
    } catch (error) {
      console.error('Activate error:', error)
      toast.error('Mining system not available. Please check if API routes are created.')
    } finally {
      setActivatingMachine(null)
    }
  }

  const claimMachineEarnings = async (machineId: string) => {
    if (!user) return
    setClaimingMachine(machineId)
    
    try {
      const response = await fetch('/api/machines/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, machineId })
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success(`💰 ${result.message}`)
        refreshDashboard()
      } else {
        toast.error(result.message || 'Claim failed: ' + result.error)
      }
    } catch (error) {
      toast.error('Error claiming earnings')
      console.error('Claim error:', error)
    } finally {
      setClaimingMachine(null)
    }
  }

  // Calculate mining states - FIXED VERSION (less strict detection)
  const calculateMiningStates = async () => {
    if (!user) return

    try {
      const { data: userMachines, error } = await supabase
        .from('user_machines')
        .select(`
          machine_type_id,
          is_active,
          activated_at,
          last_claim_time,
          machine_types (
            daily_earnings,
            name,
            image_url
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error

      const miningStates: Record<string, MiningMachine> = {}
      const now = new Date()
      
      userMachines?.forEach(um => {
        const machineData = Array.isArray(um.machine_types) ? um.machine_types[0] : um.machine_types
        
        // FIX: Less strict condition - only check is_active
        const isActuallyActive = um.is_active === true
        
        let hoursPassed = 0
        let canClaim = false
        let progress = 0
        let hoursRemaining = 24
        
        if (isActuallyActive && um.last_claim_time) {
          const lastClaim = new Date(um.last_claim_time)
          hoursPassed = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60)
          canClaim = hoursPassed >= 24
          progress = Math.min((hoursPassed / 24) * 100, 100)
          hoursRemaining = Math.max(0, 24 - hoursPassed)
        }

        miningStates[um.machine_type_id] = {
          isActive: isActuallyActive,
          lastClaim: um.last_claim_time,
          activatedAt: um.activated_at,
          dailyEarnings: machineData?.daily_earnings || 0,
          name: machineData?.name || 'Unknown Machine',
          image: machineData?.image_url || null,
          canClaim: canClaim,
          progress: progress,
          hoursRemaining: hoursRemaining,
          timeRemaining: hoursRemaining > 0 ? 
            `${Math.floor(hoursRemaining)}h ${Math.floor((hoursRemaining % 1) * 60)}m` : 'Ready!'
        }
      })

      setMiningMachines(miningStates)
    } catch (error) {
      console.error('Mining states error:', error)
      // FIX: Type-safe error handling
      if (error && typeof error === 'object' && 'code' in error && error.code !== '42703') {
        toast.error('Failed to load mining states')
      }
    }
  }

  // Disable earnings history for now to avoid JSON errors
  const fetchEarningsHistory = async () => {
    setEarningsHistory([])
  }

  // Refresh all data
  const refreshDashboard = () => {
    fetchReferrals()
    calculateTodaysEarnings()
    fetchEarningsHistory()
    calculateMiningStates()
    refreshUser()
  }

  useEffect(() => {
    if (user) {
      fetchReferrals()
      calculateTodaysEarnings()
      fetchEarningsHistory()
      calculateMiningStates()
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <FloatingParticles />

      <div className="relative z-10">
        <DashboardHeader />

        <main className="container mx-auto px-4 py-6 lg:py-8 space-y-6 lg:space-y-8">
          <WalletOverview />

          {/* Earnings Overview Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Today's Estimated Earnings */}
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-300">Today's Estimate</p>
                  <p className="text-2xl font-bold text-green-400">
                    {todaysEarnings?.totalEstimated?.toLocaleString() || 0} XAF
                  </p>
                </div>
                <div className="text-green-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-green-200/70 mt-2">
                From {todaysEarnings?.machinesCount || 0} active machines
              </p>
            </div>

            {/* Total ED Balance */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-cyan-300">ED Balance</p>
                  <p className="text-2xl font-bold text-cyan-400">
                    {(user.ed_balance || 0).toFixed(2)} ED
                  </p>
                </div>
                <div className="text-cyan-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-cyan-200/70 mt-2">
                ≈ ${((user.ed_balance || 0) * 0.1).toFixed(2)} USD
              </p>
            </div>

            {/* Active Machines */}
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-300">Active Machines</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {user.machines_owned || 0}
                  </p>
                </div>
                <div className="text-purple-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-purple-200/70 mt-2">
                Generating daily income
              </p>
            </div>

            {/* Total Lifetime Earnings */}
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-300">Total Earned</p>
                  <p className="text-2xl font-bold text-amber-400">
                    ${(user.total_earned || 0).toFixed(2)}
                  </p>
                </div>
                <div className="text-amber-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-amber-200/70 mt-2">
                Lifetime earnings
              </p>
            </div>
          </div>

          {/* Manual Earnings Calculation Button */}
          <div className="flex justify-center">
            <Button 
              onClick={handleManualEarningsCalculation}
              disabled={calculatingEarnings}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-8 py-3 text-lg font-bold"
            >
              {calculatingEarnings ? "🔄 Calculating..." : "💰 Calculate Daily Earnings"}
            </Button>
          </div>

          <div className="space-y-6 lg:space-y-8">
            {/* Updated MachineMarketplace with mining props */}
            <MachineMarketplace 
              onActivateMachine={activateMachine}
              onClaimEarnings={claimMachineEarnings}
              miningMachines={miningMachines}
              activatingMachine={activatingMachine}
              claimingMachine={claimingMachine}
            />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
              <div className="xl:col-span-2 space-y-6">
                <EarningsChart />
                
                {/* Recent Earnings History */}
                <div className="bg-slate-800/30 rounded-xl p-6">
                  <h3 className="font-bold text-cyan-400 text-lg mb-4">Recent Earnings</h3>
                  {earningsHistory.length === 0 ? (
                    <p className="text-slate-400">No earnings recorded yet. Click "Calculate Daily Earnings" to start earning!</p>
                  ) : (
                    <div className="space-y-3">
                      {earningsHistory.map((earning) => (
                        <div key={earning.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                          <div>
                            <p className="text-white font-medium">
                              {earning.machine?.name || 'Machine'}
                            </p>
                            <p className="text-slate-400 text-sm">
                              {new Date(earning.earned_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-green-400 font-bold">+{earning.amount} XAF</p>
                            <p className="text-slate-400 text-sm">Daily earnings</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Updated MyMachines with mining props */}
                <MyMachines 
                  onActivateMachine={activateMachine}
                  onClaimEarnings={claimMachineEarnings}
                  miningMachines={miningMachines}
                  activatingMachine={activatingMachine}
                  claimingMachine={claimingMachine}
                />
                
                {/* Machine Earnings Breakdown */}
                {todaysEarnings?.machineEstimates && todaysEarnings.machineEstimates.length > 0 && (
                  <div className="bg-slate-800/30 rounded-xl p-6">
                    <h3 className="font-bold text-cyan-400 text-lg mb-4">Today's Machine Earnings</h3>
                    <div className="space-y-3">
                      {todaysEarnings.machineEstimates.map((machine, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-slate-300 text-sm">{machine.name}</span>
                          <span className="text-green-400 font-bold">+{machine.earnings} XAF</span>
                        </div>
                      ))}
                      <div className="border-t border-slate-600 pt-2 mt-2">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-cyan-300">Total</span>
                          <span className="text-green-400">+{todaysEarnings.totalEstimated} XAF</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Referrals Table */}
          <div className="mt-8 p-6 bg-slate-800/30 rounded-xl">
            <h3 className="font-bold text-cyan-400 text-lg mb-4">Your Referrals & Bonuses</h3>
            {referrals.length === 0 ? (
              <p className="text-slate-400">You have no referrals yet.</p>
            ) : (
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="text-xs uppercase bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-2">Username</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Bonus (ED)</th>
                    <th className="px-4 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((ref) => (
                    <tr key={ref.id} className="border-b border-slate-700">
                      <td className="px-4 py-2">{ref.referred_user?.[0]?.username ?? "N/A"}</td>
                      <td className="px-4 py-2">{ref.referred_user?.[0]?.email ?? "N/A"}</td>
                      <td className="px-4 py-2 font-bold">{ref.bonus}</td>
                      <td className="px-4 py-2">{new Date(ref.referral_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      <Toaster position="top-right" />
    </div>
  )
}