"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { ReferralOverview } from "@/components/referral-overview"
import { ReferralLink } from "@/components/referral-link"
import { ReferralHistory } from "@/components/referral-history"
import { FloatingParticles } from "@/components/floating-particles"
import { Toaster } from "sonner"

export default function ReferralsPage() {
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

        <main className="container mx-auto px-4 py-8 space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
              Referral Program
            </h1>
            <p className="text-slate-400">Invite friends and earn $5 for each successful referral</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <ReferralOverview />
              <ReferralHistory />
            </div>

            <div className="space-y-8">
              <ReferralLink />
            </div>
          </div>
        </main>
      </div>

      <Toaster position="top-right" />
    </div>
  )
}
