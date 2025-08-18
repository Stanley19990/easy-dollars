"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { WalletBalance } from "@/components/wallet-balance"
import { WithdrawalSection } from "@/components/withdrawal-section"
import { TransactionHistory } from "@/components/transaction-history"
import { EarningsConverter } from "@/components/earnings-converter"
import { FloatingParticles } from "@/components/floating-particles"
import { Toaster } from "sonner"

export default function WalletPage() {
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
          <div className="text-center mb-6 lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
              My Wallet
            </h1>
            <p className="text-slate-400 text-sm lg:text-base">Manage your earnings and withdrawals</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            <div className="xl:col-span-2 space-y-6 lg:space-y-8">
              <WalletBalance />
              <EarningsConverter />
              <TransactionHistory />
            </div>

            <div className="space-y-6 lg:space-y-8">
              <WithdrawalSection />
            </div>
          </div>
        </main>
      </div>

      <Toaster position="top-right" />
    </div>
  )
}
