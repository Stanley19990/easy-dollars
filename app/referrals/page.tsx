"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { FloatingParticles } from "@/components/floating-particles"
import { Toaster, toast } from "sonner"
import { Copy, DollarSign, Users, TrendingUp, CheckCircle, Clock } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function ReferralsPage() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()
  const [referrals, setReferrals] = useState<any[]>([])
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    totalBonusEarned: 0,
    pendingReferrals: 0
  })

  useEffect(() => {
    if (!loading && !user) router.push("/")
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchReferrals()
      setupRealtimeSubscription()
    }
  }, [user])

  const fetchReferrals = async () => {
    try {
      // Simplified query without the status column
      const { data, error } = await supabase
        .from("referrals")
        .select(`
          id,
          referrer_id,
          referred_id,
          bonus,
          referral_date,
          referred_user:users!referrals_referred_id_fkey(
            username,
            email,
            created_at
          )
        `)
        .eq("referrer_id", user?.id)
        .order("referral_date", { ascending: false })

      if (error) throw error
      setReferrals(data || [])
      calculateStats(data || [])
    } catch (err) {
      console.error("Failed to fetch referrals:", err)
      toast.error("Failed to fetch referrals")
    }
  }

  const calculateStats = (referralsData: any[]) => {
    const totalReferrals = referralsData.length
    const totalBonusEarned = referralsData.reduce((sum, r) => sum + (r.bonus || 0), 0)
    
    // Calculate pending referrals (those with no bonus yet)
    const pendingReferrals = referralsData.filter(r => !r.bonus || r.bonus === 0).length

    setReferralStats({
      totalReferrals,
      totalBonusEarned,
      pendingReferrals
    })
  }

  const setupRealtimeSubscription = () => {
    // Subscribe to referral updates
    const referralSubscription = supabase
      .channel('referral-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'referrals',
          filter: `referrer_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Referral updated:', payload)
          fetchReferrals() // Refresh data
          refreshUser() // Refresh user balance
        }
      )
      .subscribe()

    return () => {
      referralSubscription.unsubscribe()
    }
  }

  const copyReferralLink = () => {
    const referralUrl = `${window.location.origin}/signup?ref=${user?.referral_code}`
    navigator.clipboard.writeText(referralUrl)
    toast.success("Referral link copied!")
  }

  // Determine status based on bonus amount and user machines
  const getReferralStatus = (referral: any) => {
    if (referral.bonus && referral.bonus > 0) {
      return { status: 'completed', text: 'Bonus Paid', color: 'bg-green-500/20 text-green-400' }
    }
    
    // Check if referred user has any machines (you might need to fetch this separately)
    if (referral.referred_user?.machines_owned > 0) {
      return { status: 'eligible', text: 'Eligible for Bonus', color: 'bg-blue-500/20 text-blue-400' }
    }
    
    return { status: 'pending', text: 'Pending Purchase', color: 'bg-yellow-500/20 text-yellow-400' }
  }

  const getStatusBadge = (referral: any) => {
    const statusInfo = getReferralStatus(referral)
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    )
  }

  const getStatusIcon = (referral: any) => {
    const statusInfo = getReferralStatus(referral)
    
    switch (statusInfo.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'eligible':
        return <TrendingUp className="w-4 h-4 text-blue-400" />
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />
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
            <p className="text-slate-400">Invite friends and earn $5 for each referral when they purchase their first machine</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Section: Overview + History */}
            <div className="lg:col-span-2 space-y-8">
              {/* Referral Overview */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
                <h2 className="text-xl font-bold text-white">Referral Overview</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-sm text-slate-200">Total Referrals</p>
                    <p className="text-2xl font-bold text-white">{referralStats.totalReferrals}</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-sm text-slate-200">Total Bonus Earned</p>
                    <p className="text-2xl font-bold text-white">${referralStats.totalBonusEarned}</p>
                  </div>
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-sm text-slate-200">Pending Bonus</p>
                    <p className="text-2xl font-bold text-white">{referralStats.pendingReferrals}</p>
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">How It Works</h2>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="bg-cyan-500 rounded-full w-6 h-6 flex items-center justify-center text-white text-sm font-bold mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="text-white font-medium">Share your referral link</p>
                      <p className="text-slate-400 text-sm">Send your unique link to friends and family</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-cyan-500 rounded-full w-6 h-6 flex items-center justify-center text-white text-sm font-bold mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="text-white font-medium">Friend signs up and buys a machine</p>
                      <p className="text-slate-400 text-sm">Your friend must purchase at least one machine</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-cyan-500 rounded-full w-6 h-6 flex items-center justify-center text-white text-sm font-bold mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="text-white font-medium">Get $5 instantly</p>
                      <p className="text-slate-400 text-sm">We automatically credit $5 to your wallet when they make a purchase</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Referral History Table */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 overflow-x-auto">
                <h2 className="text-xl font-bold text-white mb-4">Referral History</h2>
                {referrals.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No referrals yet. Share your link to start earning!</p>
                  </div>
                ) : (
                  <table className="min-w-full text-left text-sm text-slate-200">
                    <thead>
                      <tr>
                        <th className="py-3 px-4 border-b border-slate-700">Referred User</th>
                        <th className="py-3 px-4 border-b border-slate-700">Status</th>
                        <th className="py-3 px-4 border-b border-slate-700">Bonus</th>
                        <th className="py-3 px-4 border-b border-slate-700">Referral Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referrals.map((referral) => (
                        <tr key={referral.id} className="hover:bg-slate-700/30 border-b border-slate-700/50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-white">{referral.referred_user?.username || 'New User'}</p>
                              <p className="text-xs text-slate-400">{referral.referred_user?.email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(referral)}
                              {getStatusBadge(referral)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-semibold ${
                              referral.bonus ? 'text-green-400' : 'text-slate-400'
                            }`}>
                              {referral.bonus ? `$${referral.bonus}` : '$0'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {new Date(referral.referral_date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Right Section: Referral Link & Info */}
            <div className="space-y-8">
              {/* Referral Link Card */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
                <h2 className="text-xl font-bold text-white">Your Referral Link</h2>
                <p className="text-slate-400 text-sm">
                  Share this link with friends. You earn <strong>$5</strong> when they purchase their first machine.
                </p>
                <div className="flex items-center bg-slate-900 rounded-lg p-3 space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={referralUrl}
                    className="flex-1 bg-transparent text-slate-200 focus:outline-none text-sm"
                  />
                  <button
                    onClick={copyReferralLink}
                    className="bg-cyan-500 hover:bg-cyan-600 p-2 rounded-lg text-white transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={copyReferralLink}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3 rounded-lg transition-all duration-200"
                >
                  Copy Referral Link
                </button>
              </div>

              {/* Important Notes */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="font-bold text-white mb-3">Important Notes</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>You only get credited when your referral purchases a machine</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Bonus is credited automatically within minutes of purchase</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Each referral can only be counted once</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>No limit on how many people you can refer</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Toaster position="top-right" />
    </div>
  )
}