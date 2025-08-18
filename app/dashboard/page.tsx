"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { WalletOverview } from "@/components/wallet-overview"
import { MachineMarketplace } from "@/components/machine-marketplace"
import { MyMachines } from "@/components/my-machines"
import { EarningsChart } from "@/components/earnings-chart"
import { FloatingParticles } from "@/components/floating-particles"
import { Toaster } from "sonner"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <FloatingParticles />

      <div className="relative z-10">
        <DashboardHeader />

        <main className="container mx-auto px-4 py-6 lg:py-8 space-y-6 lg:space-y-8">
          <WalletOverview />

          <div className="space-y-6 lg:space-y-8">
            <MachineMarketplace />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
              <div className="xl:col-span-2">
                <EarningsChart />
              </div>
              <div>
                <MyMachines />
              </div>
            </div>
          </div>
        </main>
      </div>

      <Toaster position="top-right" />
    </div>
  )
}
