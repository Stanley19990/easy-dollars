// app/referrals/page.tsx
"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { FloatingParticles } from "@/components/floating-particles"
import { Toaster, toast } from "sonner"
import { Copy, DollarSign, Users, TrendingUp, CheckCircle, Clock, Share2, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface ReferralStats {
  totalReferrals: number
  totalBonusEarned: number
  pendingReferrals: number
  referrals: any[]
}

export default function ReferralsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    totalReferrals: 0,
    totalBonusEarned: 0,
    pendingReferrals: 0,
    referrals: []
  })
  const [referralCode, setReferralCode] = useState("")
  const [pageLoading, setPageLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  // Updated bonus amount
  const REFERRAL_BONUS = 1000 // XAF

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
      return
    }
    
    if (user && !authLoading) {
      loadReferralData()
    }
  }, [user, authLoading, router])

  // Generate a referral code if user doesn't have one
  const generateReferralCode = async (userId: string, username: string): Promise<string> => {
    const cleanUsername = (username || 'user').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 8)
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `${cleanUsername}${randomStr}`
  }

  const loadReferralData = async () => {
    if (!user) return
    
    setPageLoading(true)
    try {
      console.log("🔄 Loading referral data for user:", user.id)

      // 1. Get or create user's referral code
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('referral_code, username')
        .eq('id', user.id)
        .single()

      if (userError) {
        console.error("Error fetching user:", userError)
        // If user doesn't exist, create a basic referral code
        const basicCode = await generateReferralCode(user.id, 'user')
        setReferralCode(basicCode)
      } else {
        let code = userData.referral_code
        
        // If no referral code exists, create one
        if (!code) {
          code = await generateReferralCode(user.id, userData.username || 'user')
          
          // Update user with new referral code (don't wait for this)
          supabase
            .from('users')
            .update({ referral_code: code })
            .eq('id', user.id)
            .then(({ error }) => {
              if (error) {
                console.error("Error updating referral code:", error)
              }
            })
        }

        setReferralCode(code)
      }

      // 2. Get referral stats directly from database
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select(`
          id,
          referred_id,
          bonus,
          referral_date,
          referred_user:users!referrals_referred_id_fkey(
            username,
            email
          )
        `)
        .eq('referrer_id', user.id)
        .order('referral_date', { ascending: false })

      if (referralsError) {
        console.error("Error fetching referrals:", referralsError)
        // Set empty stats if there's an error
        setReferralStats({
          totalReferrals: 0,
          totalBonusEarned: 0,
          pendingReferrals: 0,
          referrals: []
        })
      } else {
        console.log("📊 Referrals data:", referrals)

        const totalReferrals = referrals?.length || 0
        const totalBonusEarned = referrals?.reduce((sum: number, r: any) => sum + (r.bonus || 0), 0) || 0
        const pendingReferrals = referrals?.filter((r: any) => !r.bonus || r.bonus === 0).length || 0

        setReferralStats({
          totalReferrals,
          totalBonusEarned,
          pendingReferrals,
          referrals: referrals || []
        })
      }

    } catch (error: any) {
      console.error("Failed to load referral data:", error)
      // Set default values on error
      setReferralStats({
        totalReferrals: 0,
        totalBonusEarned: 0,
        pendingReferrals: 0,
        referrals: []
      })
      
      // Generate fallback referral code
      const fallbackCode = await generateReferralCode(user.id, 'user')
      setReferralCode(fallbackCode)
    } finally {
      setPageLoading(false)
    }
  }

  const copyReferralLink = () => {
    if (!referralCode) {
      toast.error("No referral code available")
      return
    }
    
    const referralUrl = `${window.location.origin}/signup?ref=${referralCode}`
    navigator.clipboard.writeText(referralUrl)
    setLinkCopied(true)
    toast.success("Referral link copied!")
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const copyReferralCode = () => {
    if (!referralCode) {
      toast.error("No referral code available")
      return
    }
    
    navigator.clipboard.writeText(referralCode)
    setCopied(true)
    toast.success("Referral code copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  const shareViaWhatsApp = () => {
    if (!referralCode) {
      toast.error("No referral code available")
      return
    }
    
    const message = `Join me on Easy Dollars and start earning money with AI gaming machines! Use my referral code: ${referralCode}\n\n${window.location.origin}/signup?ref=${referralCode}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank")
  }

  const getReferralStatus = (referral: any) => {
    if (referral.bonus > 0) {
      return { 
        status: 'completed', 
        text: 'Bonus Paid', 
        color: 'bg-green-500/20 text-green-400', 
        icon: CheckCircle 
      }
    }
    
    return { 
      status: 'pending', 
      text: 'Pending Purchase', 
      color: 'bg-yellow-500/20 text-yellow-400', 
      icon: Clock 
    }
  }

  // Show loading state
  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <DashboardHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-cyan-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading referral program...</p>
            <p className="text-slate-500 text-sm mt-2">This may take a moment</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400">Please log in to view referrals</p>
        </div>
      </div>
    )
  }

  const referralUrl = `${window.location.origin}/signup?ref=${referralCode}`

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
            <p className="text-slate-400">Invite friends and earn {REFERRAL_BONUS.toLocaleString()} XAF for each referral when they purchase their first machine</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Section: Overview + History */}
            <div className="lg:col-span-2 space-y-8">
              {/* Referral Overview */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
                <h2 className="text-xl font-bold text-white">Referral Overview</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl p-4 text-center">
                    <Users className="h-5 w-5 text-white mx-auto mb-2" />
                    <p className="text-sm text-slate-200">Total Referrals</p>
                    <p className="text-2xl font-bold text-white">{referralStats.totalReferrals}</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-center">
                    <DollarSign className="h-5 w-5 text-white mx-auto mb-2" />
                    <p className="text-sm text-slate-200">Total Bonus Earned</p>
                    <p className="text-2xl font-bold text-white">
                      {referralStats.totalBonusEarned.toLocaleString()} XAF
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 text-center">
                    <TrendingUp className="h-5 w-5 text-white mx-auto mb-2" />
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
                      <p className="text-white font-medium">Get {REFERRAL_BONUS.toLocaleString()} XAF instantly</p>
                      <p className="text-slate-400 text-sm">We automatically credit {REFERRAL_BONUS.toLocaleString()} XAF to your wallet when they make their first purchase</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Referral History Table */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 overflow-x-auto">
                <h2 className="text-xl font-bold text-white mb-4">Referral History</h2>
                {referralStats.referrals.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No referrals yet. Share your link to start earning!</p>
                    <p className="text-xs text-slate-500 mt-2">
                      When someone signs up with your referral link, they'll appear here.
                    </p>
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
                      {referralStats.referrals.map((referral) => {
                        const statusInfo = getReferralStatus(referral)
                        const StatusIcon = statusInfo.icon
                        
                        return (
                          <tr key={referral.id} className="hover:bg-slate-700/30 border-b border-slate-700/50">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-white">
                                  {referral.referred_user?.username || 'New User'}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {referral.referred_user?.email || `User ID: ${referral.referred_id?.substring(0, 8) || 'Unknown'}...`}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                <StatusIcon className="w-4 h-4" />
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                  {statusInfo.text}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`font-semibold ${
                                referral.bonus > 0 ? 'text-green-400' : 'text-slate-400'
                              }`}>
                                {referral.bonus > 0 ? `${referral.bonus.toLocaleString()} XAF` : '0 XAF'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {referral.referral_date ? new Date(referral.referral_date).toLocaleDateString() : 'Unknown'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Right Section: Referral Tools */}
            <div className="space-y-8">
              {/* Referral Code Card */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
                <h2 className="text-xl font-bold text-white">Your Referral Code</h2>
                <div className="bg-slate-900 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-cyan-400 font-mono">
                    {referralCode || "Loading..."}
                  </div>
                  <p className="text-sm text-slate-400 mt-2">
                    Share this code with friends
                  </p>
                </div>
                <button
                  onClick={copyReferralCode}
                  disabled={!referralCode}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Referral Code
                    </>
                  )}
                </button>
              </div>

              {/* Referral Link Card */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
                <h2 className="text-xl font-bold text-white">Your Referral Link</h2>
                <p className="text-slate-400 text-sm">
                  Share this link with friends. You earn <strong>{REFERRAL_BONUS.toLocaleString()} XAF</strong> when they purchase their first machine.
                </p>
                <div className="flex items-center bg-slate-900 rounded-lg p-3 space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={referralUrl}
                    className="flex-1 bg-transparent text-slate-200 focus:outline-none text-sm"
                    placeholder={referralCode ? "" : "Loading referral code..."}
                  />
                  <button
                    onClick={copyReferralLink}
                    disabled={!referralCode}
                    className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-lg text-white transition-colors"
                  >
                    {linkCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={shareViaWhatsApp}
                  disabled={!referralCode}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share via WhatsApp</span>
                </button>
              </div>

              {/* Important Notes */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="font-bold text-white mb-3">Important Notes</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>You only get credited when your referral purchases their FIRST machine</span>
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
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>Referral bonus: {REFERRAL_BONUS.toLocaleString()} XAF per successful referral</span>
                  </li>
                </ul>
              </div>

              {/* Bonus Info Card */}
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-2">{REFERRAL_BONUS.toLocaleString()} XAF</div>
                  <div className="text-sm text-purple-300">Per Successful Referral</div>
                  <div className="text-xs text-slate-400 mt-2">
                    That's approximately ${(REFERRAL_BONUS / 600).toFixed(2)} USD per referral!
                  </div>
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