"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminHeader } from "@/components/admin-header"
import { AdminStats } from "@/components/admin-stats"
import { UserManagement } from "@/components/user-management"
import { WithdrawalManagement } from "@/components/withdrawal-management"
import { FloatingParticles } from "@/components/floating-particles"
import { Toaster } from "sonner"
import { AdminWallet } from "@/components/admin-wallet"

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Mock admin check - in real app, this would verify admin credentials
    const adminCheck = localStorage.getItem("easy_dollars_admin")
    if (adminCheck === "true") {
      setIsAdmin(true)
    } else {
      router.push("/admin/login")
    }
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <FloatingParticles />

      <div className="relative z-10">
        <AdminHeader />

        <main className="container mx-auto px-4 py-6 lg:py-8 space-y-6 lg:space-y-8">
          <div className="text-center mb-6 lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
              Admin Dashboard
            </h1>
            <p className="text-slate-400 text-sm lg:text-base">Manage users, withdrawals, and platform analytics</p>
          </div>

          <AdminStats />

          <AdminWallet />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            <UserManagement />
            <WithdrawalManagement />
          </div>
        </main>
      </div>

      <Toaster position="top-right" />
    </div>
  )
}
