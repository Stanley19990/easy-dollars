// components/machine-marketplace.tsx - UPDATED WITH REFERRAL BONUS TRIGGER
"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Zap, TrendingUp, Star, Clock, DollarSign, Cpu, BarChart3, Calendar, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { PaymentModal } from "@/components/payment-modal"
import { supabase } from "@/lib/supabase"

interface MachineType {
  id: string
  name: string
  price: number
  daily_earnings: number
  monthly_earnings: number
  description: string
  features: string[]
  image_query: string
  is_available: boolean
  gradient: string
  image_url?: string
}

interface MachineMarketplaceProps {
  onPurchaseSuccess?: () => void;
}

export function MachineMarketplace({ onPurchaseSuccess }: MachineMarketplaceProps) {
  const { user, refreshUser } = useAuth()
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedMachine, setSelectedMachine] = useState<MachineType | null>(null)
  const [databaseMachines, setDatabaseMachines] = useState<MachineType[]>([])
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({})
  const [userMachines, setUserMachines] = useState<string[]>([])

  // ✅ FIX: Track active payment for status polling
  const [activePaymentTransId, setActivePaymentTransId] = useState<string | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  // Fetch machines from database
  const fetchMachinesFromDatabase = async () => {
    try {
      const { data, error } = await supabase
        .from('machine_types')
        .select('*')
        .order('id')

      if (error) throw error

      if (data && data.length > 0) {
        setDatabaseMachines(data)
        // Preload images
        data.forEach(machine => {
          if (machine.image_url) {
            const img = new Image()
            img.src = machine.image_url
            img.onload = () => {
              setImagesLoaded(prev => ({ ...prev, [machine.id]: true }))
            }
          }
        })
      }
    } catch (error) {
      console.error('Error fetching machines:', error)
    }
  }

  // Fetch user's owned machines
  const fetchUserMachines = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('user_machines')
        .select('machine_type_id')
        .eq('user_id', user.id)

      if (error) throw error
      const ownedMachineIds = data?.map(m => m.machine_type_id) || []
      setUserMachines(ownedMachineIds)
    } catch (error) {
      console.error('Error fetching user machines:', error)
    }
  }

  useEffect(() => {
    fetchMachinesFromDatabase()
    if (user) {
      fetchUserMachines()
    }
  }, [user])

  // ✅ FIX: Poll for payment status when there's an active payment
  useEffect(() => {
    if (!activePaymentTransId || !user) {
      if (pollingInterval) {
        clearInterval(pollingInterval)
        setPollingInterval(null)
      }
      return
    }

    console.log('🔄 Starting payment status polling for:', activePaymentTransId)
    const interval = setInterval(async () => {
      await checkPaymentStatus(activePaymentTransId)
    }, 3000) // Poll every 3 seconds

    setPollingInterval(interval)

    // Stop polling after 2 minutes
    const timeout = setTimeout(() => {
      if (interval) clearInterval(interval)
      setActivePaymentTransId(null)
      setPurchasing(null)
      toast.info("Payment verification timed out. Please check your machines or refresh the page.")
    }, 2 * 60 * 1000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [activePaymentTransId, user])

  // ✅ UPDATED: Check payment status via transaction lookup with referral bonus trigger
  const checkPaymentStatus = async (transId: string) => {
    try {
      const { data: transaction, error } = await supabase
        .from('transactions')
        .select('status, metadata, user_id')
        .eq('fapshi_trans_id', transId)
        .single()

      if (error) {
        console.error('Error checking payment status:', error)
        return
      }

      console.log('📊 Payment status:', transaction.status)

      if (transaction.status === 'successful') {
        // Payment successful - stop polling and refresh
        console.log('✅ Payment confirmed successful!')
        
        if (pollingInterval) {
          clearInterval(pollingInterval)
          setPollingInterval(null)
        }
        setActivePaymentTransId(null)
        setPurchasing(null)

        // ✅ NEW: Process referral bonus immediately after successful payment
        try {
          console.log('🎁 Triggering referral bonus check for user:', transaction.user_id)
          const bonusResponse = await fetch('/api/referrals/process-bonus', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: transaction.user_id })
          })
          
          const bonusResult = await bonusResponse.json()
          console.log('🎁 Referral bonus result:', bonusResult)
          
          if (bonusResult.success && bonusResult.bonusAmount) {
            toast.success(`🎉 Your referrer earned ${bonusResult.bonusAmount.toLocaleString()} XAF!`)
          }
        } catch (bonusError) {
          console.error('⚠️ Referral bonus error (non-critical):', bonusError)
        }

        // Refresh user machines
        await fetchUserMachines()
        await refreshUser()
        
        toast.success("🎉 Purchase successful! Your machine has been activated.")
        
        if (onPurchaseSuccess) {
          onPurchaseSuccess()
        }
      } else if (transaction.status === 'failed' || transaction.status === 'cancelled') {
        // Payment failed
        if (pollingInterval) {
          clearInterval(pollingInterval)
          setPollingInterval(null)
        }
        setActivePaymentTransId(null)
        setPurchasing(null)
        toast.error("❌ Payment failed. Please try again.")
      }
      // If still pending, continue polling
    } catch (error) {
      console.error('Error in checkPaymentStatus:', error)
    }
  }

  // Check if user owns a machine
  const userOwnsMachine = (machineId: string) => {
    return userMachines.includes(machineId)
  }

  // Get gradient classes
  const getGradientClasses = (gradientType: string) => {
    const gradients: Record<string, { bg: string; border: string; button: string }> = {
      "blue-cyan": {
        bg: "from-blue-500 to-cyan-500",
        border: "border-blue-500/20",
        button: "from-blue-500 to-cyan-500"
      },
      "purple-pink": {
        bg: "from-purple-500 to-pink-500",
        border: "border-purple-500/20",
        button: "from-purple-500 to-pink-500"
      },
      "green-emerald": {
        bg: "from-green-500 to-emerald-500",
        border: "border-green-500/20",
        button: "from-green-500 to-emerald-500"
      },
      "orange-red": {
        bg: "from-orange-500 to-red-500",
        border: "border-orange-500/20",
        button: "from-orange-500 to-red-500"
      }
    }
    return gradients[gradientType] || gradients["blue-cyan"]
  }

  // Handle purchase click
  const handlePurchaseClick = (machineId: string) => {
    if (!user) {
      toast.error("Please log in to purchase machines")
      return
    }

    // ✅ FIX: Prevent multiple simultaneous purchases
    if (purchasing) {
      toast.info("Please wait for your current purchase to complete")
      return
    }

    const machine = databaseMachines.find((m) => m.id === machineId)
    if (!machine) {
      toast.error("Machine not found. Please try again.")
      return
    }

    // Check if already owned
    if (userOwnsMachine(machineId)) {
      toast.info("You already own this machine")
      return
    }

    setSelectedMachine(machine)
    setPaymentModalOpen(true)
  }

  // ✅ FIX: Handle payment success with polling
  const handlePaymentSuccess = async (transId: string, externalId: string) => {
    console.log('💳 Payment initiated:', { transId, externalId })
    toast.success("Payment request sent! Please complete on your phone.")
    toast.info("📱 We'll automatically update when payment is confirmed")
    
    setPaymentModalOpen(false)
    setSelectedMachine(null)
    
    // Start polling for payment status
    setActivePaymentTransId(transId)
    setPurchasing(selectedMachine?.id || null)
  }

  const getMachineIcon = (index: number) => {
    const icons = [Zap, Cpu, Star, TrendingUp, DollarSign, BarChart3]
    const IconComponent = icons[index % icons.length]
    return <IconComponent className="h-8 w-8 text-white" />
  }

  // Calculate ROI period in days
  const calculateROI = (price: number, dailyEarnings: number) => {
    if (dailyEarnings === 0) return "N/A"
    return Math.ceil(price / dailyEarnings)
  }

  if (!user) return null

  return (
    <>
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-6 w-6 text-cyan-400" />
            <span className="text-2xl text-white">AI Gaming Machine Marketplace</span>
          </CardTitle>
          <p className="text-slate-400 text-base mt-2">
            Purchase AI-powered gaming machines with ultra-realistic 4K animations that automatically watch ads and earn you money 24/7.
          </p>
          
          {/* ✅ FIX: Show polling indicator */}
          {activePaymentTransId && (
            <div className="mt-2 flex items-center space-x-2 text-sm text-cyan-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
              <span>Waiting for payment confirmation...</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {databaseMachines.map((machine, index) => {
              const isImageLoaded = imagesLoaded[machine.id]
              const hasDatabaseImage = machine.image_url
              const gradient = getGradientClasses(machine.gradient || "blue-cyan")
              const owned = userOwnsMachine(machine.id)
              const roiDays = calculateROI(machine.price, machine.daily_earnings)
              const isProcessing = purchasing === machine.id

              return (
                <Card
                  key={machine.id}
                  className={`bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 ${
                    !machine.is_available ? "opacity-90" : ""
                  } ${isProcessing ? "border-cyan-500 shadow-lg shadow-cyan-500/30" : ""}`}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <CardTitle className="text-xl text-white font-bold">{machine.name}</CardTitle>
                      {!machine.is_available ? (
                        <Badge
                          variant="secondary"
                          className="bg-amber-500/20 text-amber-400 border-0 font-bold text-sm px-3 py-1"
                        >
                          Coming Soon
                        </Badge>
                      ) : owned ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-500/20 text-green-400 border-0 font-bold text-sm px-3 py-1"
                        >
                          Owned
                        </Badge>
                      ) : isProcessing ? (
                        <Badge
                          variant="secondary"
                          className="bg-cyan-500/20 text-cyan-400 border-0 font-bold text-sm px-3 py-1 animate-pulse"
                        >
                          Processing...
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className={`bg-gradient-to-r ${gradient.button} text-white border-0 font-bold text-sm px-3 py-1`}
                        >
                          {roiDays} days ROI
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Machine Image */}
                    <div
                      className={`aspect-square bg-gradient-to-br ${gradient.bg} rounded-xl flex items-center justify-center relative overflow-hidden shadow-lg transform transition-transform duration-500 hover:scale-105 hover:rotate-1`}
                    >
                      <div className="absolute inset-0 bg-black/10"></div>
                      {hasDatabaseImage ? (
                        <>
                          {!isImageLoaded && (
                            <div className="absolute inset-0 bg-slate-700 animate-pulse flex items-center justify-center">
                              <ImageIcon className="h-12 w-12 text-slate-500" />
                            </div>
                          )}
                          <img
                            src={machine.image_url}
                            alt={machine.name}
                            className={`w-full h-full object-cover rounded-xl transition-all duration-500 ${
                              isImageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                            } hover:scale-110 hover:rotate-1`}
                            onLoad={() => setImagesLoaded(prev => ({ ...prev, [machine.id]: true }))}
                          />
                        </>
                      ) : (
                        <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-slate-500" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <div
                          className={`w-3 h-3 ${
                            !machine.is_available
                              ? "bg-amber-400"
                              : owned
                              ? "bg-green-400"
                              : isProcessing
                              ? "bg-cyan-400"
                              : "bg-blue-400"
                          } rounded-full animate-pulse shadow-lg`}
                        ></div>
                      </div>
                      <div className="absolute bottom-3 left-3">
                        <div className={`p-2 bg-gradient-to-r ${gradient.button} rounded-lg shadow-lg`}>
                          {getMachineIcon(index)}
                        </div>
                      </div>
                    </div>

                    {/* Description & Features */}
                    <div>
                      <p className="text-sm text-slate-300 leading-relaxed mb-3">{machine.description}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {machine.features && machine.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-xs text-slate-400">
                            <div className={`w-1.5 h-1.5 bg-gradient-to-r ${gradient.button} rounded-full`}></div>
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Earnings Information */}
                    <div className="bg-slate-800/70 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-green-400" />
                          <span className="text-sm text-slate-300">Daily Earnings</span>
                        </div>
                        <span className="text-lg font-bold text-green-400">
                          {machine.daily_earnings.toLocaleString()} XAF
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-blue-400" />
                          <span className="text-sm text-slate-300">Monthly Earnings</span>
                        </div>
                        <span className="text-lg font-bold text-blue-400">
                          {machine.monthly_earnings.toLocaleString()} XAF
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-amber-400" />
                          <span className="text-sm text-slate-300">ROI Period</span>
                        </div>
                        <span className="text-sm font-bold text-amber-400">{roiDays} Days</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      {/* Price Display */}
                      <div className="text-center bg-slate-800/50 rounded-lg p-4">
                        <div className="text-3xl font-bold text-white mb-1">{machine.price.toLocaleString()} XAF</div>
                        <div className="text-sm text-slate-400">One-time payment</div>
                      </div>

                      {/* Purchase Button */}
                      {owned ? (
                        <Button
                          disabled
                          className="w-full bg-green-500/20 text-green-400 border-green-500/30 font-bold text-lg py-6 shadow-lg"
                        >
                          ✓ Already Owned
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handlePurchaseClick(machine.id)}
                          disabled={!machine.is_available || isProcessing || !!purchasing}
                          className={`w-full bg-gradient-to-r ${gradient.button} hover:opacity-90 disabled:opacity-50 font-bold text-lg py-6 shadow-lg transition-all duration-200 hover:scale-105`}
                        >
                          {!machine.is_available ? (
                            "Coming Soon"
                          ) : isProcessing ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Processing Payment...</span>
                            </div>
                          ) : purchasing ? (
                            "Please Wait..."
                          ) : (
                            <div className="flex items-center space-x-2">
                              <ShoppingCart className="h-5 w-5" />
                              <span>Buy Now</span>
                            </div>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Empty State */}
          {databaseMachines.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-slate-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-10 w-10 text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-300 mb-2">No Machines Available</h3>
              <p className="text-slate-400">Check back later for new AI gaming machines.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {selectedMachine && (
        <PaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          machine={selectedMachine}
          user={{
            id: user.id,
            email: user.email || "",
            name: user.user_metadata?.full_name || user.user_metadata?.username || "User",
            phone: user.user_metadata?.phone || ""
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </>
  )
}