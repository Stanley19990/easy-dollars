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
import { NotificationBell } from '@/components/notification-bell'
import PromoModal from "@/components/PromoModal"
import WeeklyReferralModal from "@/components/WeeklyReferralModal"
import LiveWithdrawals from "@/components/LiveWithdrawals"

// Define types
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

  // Refresh function for child components
  const refreshDashboard = () => {
    fetchReferrals()
    calculateTodaysEarnings()
    fetchEarningsHistory()
    refreshUser()
  }

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) router.push("/")
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      // Load data in parallel
      Promise.all([
        fetchReferrals(),
        calculateTodaysEarnings(),
        fetchEarningsHistory()
      ])
    }
  }, [user])

  // Fetch referrals
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
    } catch (err: any) {
      console.error("Referrals fetch error:", err)
    }
  }

  // Calculate today's earnings
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

      userMachines?.forEach((um: any) => {
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
    } catch (error: any) {
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

      for (const userMachine of userMachines) {
        const machineData = Array.isArray((userMachine as any).machine_types) 
          ? (userMachine as any).machine_types[0] 
          : (userMachine as any).machine_types
        
        const dailyEarning = machineData?.daily_earnings || 0
        totalEarnings += dailyEarning
        
        earningsDetails.push({
          machineId: (userMachine as any).machine_type_id,
          machineName: machineData?.name || 'Unknown Machine',
          earnings: dailyEarning
        })

        await supabase
          .from('earnings')
          .insert({
            user_id: user.id,
            machine_id: (userMachine as any).id,
            amount: dailyEarning,
            earned_at: new Date().toISOString(),
            type: 'daily_earnings'
          })
      }

      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('ed_balance, total_earned')
        .eq('id', user.id)
        .single()

      if (fetchError) throw fetchError

      const currentEdBalance = userData?.ed_balance || 0
      const currentTotalEarned = userData?.total_earned || 0

      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          ed_balance: currentEdBalance + totalEarnings,
          total_earned: currentTotalEarned + totalEarnings
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      toast.success(`💰 Earned ${totalEarnings} XAF from ${earningsDetails.length} machines!`)
      refreshDashboard()

    } catch (error: any) {
      console.error('Manual earnings error:', error)
      toast.error('Failed to calculate earnings: ' + (error.message || 'Unknown error'))
    } finally {
      setCalculatingEarnings(false)
    }
  }

  const fetchEarningsHistory = async () => {
    setEarningsHistory([])
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <FloatingParticles />
      <NotificationBell />
      
      {/* 🔥 Weekly Referral Modal - Shows first */}
      <WeeklyReferralModal />
      
      {/* 🔥 ANNOUNCEMENT POPUP */}
      <PromoModal
        title="📢 Withdrawals Now Fully Available!"
        message="Good news! The withdrawal system is now completely fixed. All users can now withdraw their earnings instantly without any restrictions."
        showButton={true}
        buttonText="Go to Wallet"
        type="announcement"
      />
      
      {/* 🔥 DISCOUNT POPUP */}
      <PromoModal
        title="🔥 5% Discount Available!"
        message="50K, 100K and 150K machines are now discounted. Limited time offer."
        type="discount"
      />
      
      {/* 🔥 WITHDRAWAL POPUP */}
      <PromoModal
        title="💸 Withdrawals Now Enabled"
        message="All users can now withdraw their earnings without restriction."
        showButton={true}
        buttonText="Withdraw Now"
        type="withdrawal"
      />

      {/* 🔥 Live activity ticker */}
      <LiveWithdrawals />

      <div className="relative z-10">
        <DashboardHeader />

        <main className="container mx-auto px-4 py-6 lg:py-8 space-y-6 lg:space-y-8">
          {/* Wallet Section with ID for scrolling */}
          <div id="wallet-section">
            <WalletOverview />
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
            <MachineMarketplace onPurchaseSuccess={refreshDashboard} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
              <div className="xl:col-span-2 space-y-6">
                <EarningsChart />
                
                <div className="bg-slate-800/30 rounded-xl p-6">
                  <h3 className="font-bold text-cyan-400 text-lg mb-4">Recent Earnings</h3>
                  {earningsHistory.length === 0 ? (
                    <p className="text-slate-400">No earnings recorded yet. Click "Calculate Daily Earnings" to start earning!</p>
                  ) : (
                    <div className="space-y-3">
                      {earningsHistory.map((earning) => (
                        <div key={earning.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                          <div>
                            <p className="text-white font-medium">{earning.machine?.name || 'Machine'}</p>
                            <p className="text-slate-400 text-sm">{new Date(earning.earned_at).toLocaleDateString()}</p>
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
                <MyMachines onRefresh={refreshDashboard} />
                
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