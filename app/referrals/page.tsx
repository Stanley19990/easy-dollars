"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { FloatingParticles } from "@/components/floating-particles"
import { Toaster, toast } from "sonner"
import { Copy } from "lucide-react"
import { supabase } from "@/lib/supabase" // Make sure you have Supabase client

export default function ReferralsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [referrals, setReferrals] = useState<any[]>([])

  useEffect(() => {
    if (!loading && !user) router.push("/")
  }, [user, loading, router])

  useEffect(() => {
    if (user) fetchReferrals()
  }, [user])

  const fetchReferrals = async () => {
    try {
      const { data, error } = await supabase
        .from("referrals")
        .select(`
          id,
          referrer_id,
          referred_id,
          bonus,
          referral_date,
          referred_user:users!referrals_referred_id_fkey(username)
        `)
        .eq("referrer_id", user?.id)
        .order("referral_date", { ascending: false })

      if (error) throw error
      setReferrals(data || [])
    } catch (err) {
      console.error(err)
      toast.error("Failed to fetch referrals")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  if (!user) return null

  const referralUrl = `${window.location.origin}/signup?ref=${user.referral_code}`

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <FloatingParticles />
      <div className="relative z-10">
        <DashboardHeader />

        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
              Referral Program
            </h1>
            <p className="text-slate-400">Invite friends and earn 500 ED coins for each successful referral</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Section: Overview + History */}
            <div className="lg:col-span-2 space-y-8">
              {/* Referral Overview */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
                <h2 className="text-xl font-bold text-white">Referral Overview</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl p-4 text-center">
                    <p className="text-sm text-slate-200">Total Referrals</p>
                    <p className="text-2xl font-bold text-white">{referrals.length}</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-center">
                    <p className="text-sm text-slate-200">Total Bonus Earned</p>
                    <p className="text-2xl font-bold text-white">
                      {referrals.reduce((sum, r) => sum + (r.bonus || 0), 0)} ED
                    </p>
                  </div>
                </div>
              </div>

              {/* Referral History Table */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 overflow-x-auto">
                <h2 className="text-xl font-bold text-white mb-4">Referral History</h2>
                {referrals.length === 0 ? (
                  <p className="text-slate-400 text-sm">No referrals yet.</p>
                ) : (
                  <table className="min-w-full text-left text-sm text-slate-200">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 border-b border-slate-700">Referred User</th>
                        <th className="py-2 px-4 border-b border-slate-700">Bonus Earned</th>
                        <th className="py-2 px-4 border-b border-slate-700">Referral Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referrals.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-700/30">
                          <td className="py-2 px-4">{r.referred_user?.username || r.referred_id}</td>
                          <td className="py-2 px-4">{r.bonus} ED</td>
                          <td className="py-2 px-4">{new Date(r.referral_date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Right Section: Referral Link */}
            <div className="space-y-8">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
                <h2 className="text-xl font-bold text-white">Your Referral Link</h2>
                <p className="text-slate-400 text-sm">
                  Share this link with friends. You earn <strong>500 ED</strong> when they purchase a machine.
                </p>
                <div className="flex items-center bg-slate-900 rounded-lg p-3 space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={referralUrl}
                    className="flex-1 bg-transparent text-slate-200 focus:outline-none text-sm"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(referralUrl)
                      toast.success("Referral link copied!")
                    }}
                    className="bg-cyan-500 hover:bg-cyan-600 p-2 rounded-lg text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Toaster position="top-right" />
    </div>
  )
}
