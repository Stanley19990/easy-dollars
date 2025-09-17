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
import { AdWatchingModal, type AdReward } from "@/components/ad-watching-modal"
import { supabase } from "@/lib/supabase"

export default function DashboardPage() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()

  const [isAdModalOpen, setAdModalOpen] = useState(false)
  const [selectedMachine, setSelectedMachine] = useState<{ id: string; name: string } | null>(null)
  const [referrals, setReferrals] = useState<any[]>([])

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
      setReferrals(data ?? [])
    } catch (err) {
      console.error("Referrals fetch error:", err)
      toast.error("Failed to load referrals")
    }
  }

  useEffect(() => {
    fetchReferrals()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  if (!user) return null

  // Open Ad Modal
  const handleWatchAd = (machineId: string, machineName: string) => {
    setSelectedMachine({ id: machineId, name: machineName })
    setAdModalOpen(true)
  }

  // Handle reward
  const handleRewardEarned = (reward: AdReward) => {
    console.log("Reward earned:", reward)
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <FloatingParticles />

      <div className="relative z-10">
        <DashboardHeader />

        <main className="container mx-auto px-4 py-6 lg:py-8 space-y-6 lg:space-y-8">
          <WalletOverview />

          <div className="space-y-6 lg:space-y-8">
            <MachineMarketplace onWatchAd={handleWatchAd} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
              <div className="xl:col-span-2">
                <EarningsChart />
              </div>
              <div>
                <MyMachines onWatchAd={handleWatchAd} />
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
                      <td className="px-4 py-2">{ref.referred_user?.username ?? "N/A"}</td>
                      <td className="px-4 py-2">{ref.referred_user?.email ?? "N/A"}</td>
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

      {selectedMachine && (
        <AdWatchingModal
          isOpen={isAdModalOpen}
          onClose={() => setAdModalOpen(false)}
          machineId={selectedMachine.id}
          machineName={selectedMachine.name}
          onRewardEarned={handleRewardEarned}
        />
      )}

      <Toaster position="top-right" />
    </div>
  )
}
