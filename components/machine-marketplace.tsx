"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Zap, TrendingUp, Star, Clock, DollarSign, Cpu, Play, BarChart3, Calendar, Image as ImageIcon, Timer, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { PaymentModal } from "@/components/payment-modal"
import { supabase } from "@/lib/supabase"

interface MachineType {
  id: string
  name: string
  price: number
  daily_earning_rate: number
  monthly_earning: number
  description: string
  features: string[]
  image_query: string
  is_available: boolean
  gradient: string
  image_url?: string
  // Database field names (these might be different)
  daily_earnings?: number
  monthly_earnings?: number
}

interface MiningMachine {
  isActive: boolean;
  lastClaim: string | null;
  activatedAt: string | null;
  dailyEarnings: number;
  name: string;
  image: string | null;
  canClaim: boolean;
  progress: number;
  hoursRemaining: number;
  timeRemaining: string;
}

interface MachineMarketplaceProps {
  onWatchAd?: (machineId: string, machineName: string) => void;
  onActivateMachine?: (machineId: string) => void;
  onClaimEarnings?: (machineId: string) => void;
  miningMachines?: Record<string, MiningMachine>;
  activatingMachine?: string | null;
  claimingMachine?: string | null;
}

export function MachineMarketplace({ 
  onWatchAd, 
  onActivateMachine, 
  onClaimEarnings, 
  miningMachines = {}, 
  activatingMachine = null, 
  claimingMachine = null 
}: MachineMarketplaceProps) {
  const { user, refreshUser } = useAuth()
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedMachine, setSelectedMachine] = useState<MachineType | null>(null)
  const [databaseMachines, setDatabaseMachines] = useState<MachineType[]>([])
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({})
  const [userMachines, setUserMachines] = useState<any[]>([])

  // Fetch machines from database including image URLs
const fetchMachinesFromDatabase = async () => {
  try {
    console.log('🔍 Fetching machines from database...')
    
    const { data, error } = await supabase
      .from('machine_types')
      .select('*')
      .order('id')

    if (error) {
      console.error('❌ Database fetch error:', error)
      throw error
    }
    
    console.log('✅ Machines from database:', data?.map(m => ({ id: m.id, name: m.name, typeOfId: typeof m.id })))
    
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
          img.onerror = () => {
            console.warn(`Failed to load image for machine ${machine.id}`)
            setImagesLoaded(prev => ({ ...prev, [machine.id]: false }))
          }
        }
      })
    } else {
      console.log('⚠️ No machines found in database, using fallback')
      setDatabaseMachines(machines)
    }
  } catch (error) {
    console.error('❌ Error fetching machines from database:', error)
    // Fallback to hardcoded machines if database fails
    setDatabaseMachines(machines)
  }
}

  // Fetch user's owned machines
  const fetchUserMachines = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('user_machines')
        .select('machine_type_id, is_active, activated_at, last_claim_time')
        .eq('user_id', user.id)
      
      if (error) throw error
      setUserMachines(data || [])
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

  const machines: MachineType[] = [
    // ... (keep your existing machines array exactly as it is)
    {
      id: "1",
      name: "AI Gaming Starter Pro",
      price: 2500,
      daily_earning_rate: 900,
      monthly_earning: 27000,
      description:
        "Entry-level AI gaming machine with stunning 4K holographic displays and neural networks for optimal ad targeting. Perfect for beginners with 24/7 automated operation.",
      features: ["4K Holographic Display", "Neural Ad Targeting", "24/7 Operation", "Real-time Tracking"],
      image_query: "futuristic blue holographic AI gaming machine with glowing circuits and 4K displays",
      is_available: true,
      gradient: "blue-cyan",
    },
    {
      id: "2",
      name: "Smart Gaming Engine X1",
      price: 5000,
      daily_earning_rate: 1650,
      monthly_earning: 49500,
      description:
        "Enhanced AI gaming system with premium 4K animations and smart targeting algorithms. Features holographic interface and bonus multipliers for higher earnings.",
      features: ["Premium 4K Animations", "Smart Algorithms", "Holographic Interface", "Bonus Multipliers"],
      image_query: "purple smart gaming AI engine with holographic interface and glowing energy cores",
      is_available: true,
      gradient: "purple-pink",
    },
    {
      id: "3",
      name: "Quantum Gaming Processor",
      price: 10000,
      daily_earning_rate: 3500,
      monthly_earning: 105000,
      description:
        "High-performance gaming AI with quantum-level 4K animations and multiple stream processing. Features ultra-realistic gaming visuals and VIP ad access.",
      features: ["Quantum Processing", "Multiple Streams", "Ultra-realistic Visuals", "VIP Ad Access"],
      image_query: "green quantum gaming processor with energy particles and advanced holographic displays",
      is_available: true,
      gradient: "green-emerald",
    },
    {
      id: "4",
      name: "Neural Gaming Maximizer",
      price: 15000,
      daily_earning_rate: 5000,
      monthly_earning: 150000,
      description:
        "Professional-grade gaming AI with deep learning and 4K ultra-realistic animations. Accesses exclusive high-paying ad networks with advanced analytics.",
      features: ["Deep Learning AI", "Ultra-realistic 4K", "Exclusive Networks", "Advanced Analytics"],
      image_query: "orange neural gaming maximizer with brain-like patterns and glowing neural networks",
      is_available: true,
      gradient: "orange-red",
    },
    {
      id: "5",
      name: "Hyper Gaming Intelligence",
      price: 25000,
      daily_earning_rate: 8333,
      monthly_earning: 250000,
      description:
        "Ultimate gaming AI with superintelligent algorithms and 4K ultra-realistic animations. Premium advertiser networks with white-glove support and exclusive aesthetics.",
      features: ["Superintelligent AI", "Premium Networks", "White-glove Support", "Exclusive Aesthetics"],
      image_query: "red hyper gaming intelligence machine with energy beams and advanced holographic displays",
      is_available: true,
      gradient: "red-pink",
    },
    {
      id: "6",
      name: "Elite Gaming Matrix",
      price: 50000,
      daily_earning_rate: 16666,
      monthly_earning: 500000,
      description:
        "Revolutionary gaming AI with 8K ultra-realistic animations and matrix-level processing. Features next-generation gaming aesthetics and quantum ad optimization.",
      features: ["8K Ultra-realistic", "Matrix Processing", "Next-gen Aesthetics", "Quantum Optimization"],
      image_query: "golden elite gaming matrix with circuit patterns and holographic gaming interface",
      is_available: true,
      gradient: "yellow-amber",
    },
    {
      id: "7",
      name: "Omega Gaming Core",
      price: 100000,
      daily_earning_rate: 33333,
      monthly_earning: 1000000,
      description:
        "Supreme gaming AI with unlimited 4K processing and omnipotent algorithms. Ultra-realistic gaming visuals, cosmic ad networks, and interdimensional optimization.",
      features: ["Unlimited Processing", "Omnipotent AI", "Cosmic Networks", "Interdimensional Tech"],
      image_query: "cosmic silver omega gaming core with space portals and divine energy effects",
      is_available: false,
      gradient: "indigo-purple",
    },
    {
      id: "8",
      name: "Genesis Gaming God",
      price: 150000,
      daily_earning_rate: 50000,
      monthly_earning: 1500000,
      description:
        "Godlike gaming AI with transcendent 4K animations and universal processing power. Reality-bending gaming aesthetics, multiverse ad networks, and divine optimization.",
      features: ["Transcendent AI", "Universal Processing", "Reality-bending", "Multiverse Networks"],
      image_query: "divine white and gold genesis gaming machine with heavenly light effects and cosmic energy",
      is_available: false,
      gradient: "pink-rose",
    },
  ]

  // Use database machines if available, otherwise fallback to hardcoded
  const displayMachines = databaseMachines.length > 0 ? databaseMachines : machines

  // Helper function to get earnings value safely
  const getDailyEarnings = (machine: MachineType) => {
    // Try database field first, then fallback to hardcoded field
    return machine.daily_earnings || machine.daily_earning_rate || 0
  }

  const getMonthlyEarnings = (machine: MachineType) => {
    // Try database field first, then fallback to hardcoded field
    return machine.monthly_earnings || machine.monthly_earning || 0
  }

  // Get gradient classes based on gradient type
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
      },
      "red-pink": {
        bg: "from-red-500 to-pink-500",
        border: "border-red-500/20",
        button: "from-red-500 to-pink-500"
      },
      "yellow-amber": {
        bg: "from-yellow-500 to-amber-500",
        border: "border-yellow-500/20",
        button: "from-yellow-500 to-amber-500"
      },
      "indigo-purple": {
        bg: "from-indigo-500 to-purple-500",
        border: "border-indigo-500/20",
        button: "from-indigo-500 to-purple-500"
      },
      "pink-rose": {
        bg: "from-pink-500 to-rose-500",
        border: "border-pink-500/20",
        button: "from-pink-500 to-rose-500"
      }
    }
    
    return gradients[gradientType] || gradients["blue-cyan"]
  }

  // Check if user owns a machine
  const userOwnsMachine = (machineId: string) => {
    return userMachines.some(um => um.machine_type_id === machineId)
  }

  // Get mining status for a machine
  const getMiningStatus = (machineId: string) => {
    const userMachine = userMachines.find(um => um.machine_type_id === machineId)
    const miningData = miningMachines[machineId]
    
    return {
      owned: !!userMachine,
      isActive: userMachine?.is_active || false,
      miningData: miningData
    }
  }

  // Handle activate machine
  const handleActivate = async (machineId: string) => {
    if (!onActivateMachine) return
    
    await onActivateMachine(machineId)
    // Refresh user machines after activation
    setTimeout(() => fetchUserMachines(), 1000)
  }

  // Handle claim earnings
  const handleClaim = async (machineId: string) => {
    if (!onClaimEarnings) return
    
    await onClaimEarnings(machineId)
    // Refresh user machines after claim
    setTimeout(() => fetchUserMachines(), 1000)
  }

  // This function is called when user clicks "Buy Now"
const handlePurchaseClick = (machineId: string) => {
  if (!user) {
    toast.error("Please log in to purchase machines")
    return
  }
  
  console.log('🛒 DEBUG: Purchase clicked')
  console.log('  - Requested machine ID:', machineId, typeof machineId)
  console.log('  - User ID:', user.id, typeof user.id)
  
  // Log ALL available machines to see what we have
  console.log('📋 ALL display machines:', displayMachines.map(m => ({
    id: m.id, 
    name: m.name,
    typeOfId: typeof m.id,
    price: m.price
  })))
  
  const machine = displayMachines.find((m) => m.id === machineId)
  
  if (!machine) {
    console.error('❌ Machine not found in frontend data')
    console.error('❌ Available machine IDs:', displayMachines.map(m => m.id))
    toast.error("Machine not found. Please try again.")
    return
  }

  console.log('✅ Machine found in frontend:')
  console.log('  - Machine ID:', machine.id, typeof machine.id)
  console.log('  - Machine Name:', machine.name)
  console.log('  - Machine Price:', machine.price, typeof machine.price)

  // Set the selected machine and open payment modal
  setSelectedMachine(machine)
  setPaymentModalOpen(true)
}

  // This function is called after successful payment
  const handlePaymentSuccess = () => {
    toast.success("Payment completed! Your machine will be activated shortly.")
    setPaymentModalOpen(false)
    setSelectedMachine(null)
    // Refresh user data to show new machine
    refreshUser()
    // Refresh user machines list
    fetchUserMachines()
  }

  const getMachineIcon = (index: number) => {
    const icons = [Zap, Cpu, Star, TrendingUp, DollarSign, BarChart3, Play, Star]
    const IconComponent = icons[index % icons.length]
    return <IconComponent className="h-8 w-8 text-white" />
  }

  if (!user) return null

  return (
    <>
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-6 w-6 text-cyan-400" />
            <span className="text-2xl">AI Gaming Machine Marketplace</span>
          </CardTitle>
          <p className="text-slate-400 text-base mt-2">
            Purchase AI-powered gaming machines with ultra-realistic 4K animations that automatically watch ads and earn
            you money 24/7.
          </p>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {displayMachines.map((machine, index) => {
              const isImageLoaded = imagesLoaded[machine.id]
              const hasDatabaseImage = machine.image_url
              const dailyEarnings = getDailyEarnings(machine)
              const monthlyEarnings = getMonthlyEarnings(machine)
              const gradient = getGradientClasses(machine.gradient || "blue-cyan")
              const miningStatus = getMiningStatus(machine.id)
              const miningData = miningStatus.miningData
              
              return (
                <Card
                  key={machine.id}
                  className={`bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 ${
                    !machine.is_available ? "opacity-90" : ""
                  }`}
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
                      ) : miningStatus.owned ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-500/20 text-green-400 border-0 font-bold text-sm px-3 py-1"
                        >
                          Owned
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className={`bg-gradient-to-r ${gradient.button} text-white border-0 font-bold text-sm px-3 py-1`}
                        >
                          10 days ROI
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
                          {/* Loading skeleton for database images */}
                          {!isImageLoaded && (
                            <div className="absolute inset-0 bg-slate-700 animate-pulse flex items-center justify-center">
                              <ImageIcon className="h-12 w-12 text-slate-500" />
                            </div>
                          )}
                          
                          {/* Database image */}
                          <img
                            src={machine.image_url}
                            alt={machine.name}
                            className={`w-full h-full object-cover rounded-xl transition-all duration-500 ${
                              isImageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                            } hover:scale-110 hover:rotate-1`}
                            onLoad={() => setImagesLoaded(prev => ({ ...prev, [machine.id]: true }))}
                            onError={() => setImagesLoaded(prev => ({ ...prev, [machine.id]: false }))}
                          />
                        </>
                      ) : (
                        /* Fallback to local images if no database image */
                        <img
                          src={`/images/Generated Image September 15, 2025 - 7_42PM.png`}
                          alt={machine.name}
                          className="w-full h-full object-cover rounded-xl transition-transform duration-500 hover:scale-110 hover:rotate-1"
                        />
                      )}
                      
                      <div className="absolute top-3 right-3">
                        <div
                          className={`w-3 h-3 ${!machine.is_available ? "bg-amber-400" : miningStatus.owned ? "bg-green-400" : "bg-blue-400"} rounded-full animate-pulse shadow-lg`}
                        ></div>
                      </div>
                      <div className="absolute bottom-3 left-3">
                        <div className={`p-2 bg-gradient-to-r ${gradient.button} rounded-lg shadow-lg`}>
                          {getMachineIcon(index)}
                        </div>
                      </div>

                      {/* Mining Progress Overlay */}
                      {miningStatus.owned && miningData?.isActive && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-2">
                          <div className="flex items-center justify-between text-xs text-white">
                            <div className="flex items-center space-x-1">
                              <Timer className="h-3 w-3" />
                              <span>{miningData.timeRemaining}</span>
                            </div>
                            <div className="w-16 bg-slate-600 rounded-full h-1.5">
                              <div 
                                className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${miningData.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}
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

                    {/* EARNINGS INFORMATION */}
                    <div className="bg-slate-800/70 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-green-400" />
                          <span className="text-sm text-slate-300">Daily Earnings</span>
                        </div>
                        <span className="text-lg font-bold text-green-400">
                          {dailyEarnings.toLocaleString()} XAF
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-blue-400" />
                          <span className="text-sm text-slate-300">Monthly Earnings</span>
                        </div>
                        <span className="text-lg font-bold text-blue-400">
                          {monthlyEarnings.toLocaleString()} XAF
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-amber-400" />
                          <span className="text-sm text-slate-300">ROI Period</span>
                        </div>
                        <span className="text-sm font-bold text-amber-400">10 Days</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      {/* Price Display */}
                      <div className="text-center bg-slate-800/50 rounded-lg p-4">
                        <div className="text-3xl font-bold text-white mb-1">{machine.price.toLocaleString()} XAF</div>
                        <div className="text-sm text-slate-400">${(machine.price / 600).toFixed(2)} USD equivalent</div>
                      </div>

                      {/* Mining Action Buttons */}
                      {miningStatus.owned ? (
                        <div className="space-y-2">
                          {miningData?.canClaim ? (
                            <Button
                              onClick={() => handleClaim(machine.id)}
                              disabled={claimingMachine === machine.id}
                              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 font-bold text-lg py-6 shadow-lg"
                            >
                              {claimingMachine === machine.id ? (
                                "🔄 Claiming..."
                              ) : (
                                <>
                                  <CheckCircle className="h-5 w-5 mr-2" />
                                  Claim {dailyEarnings.toLocaleString()} XAF
                                </>
                              )}
                            </Button>
                          ) : miningData?.isActive ? (
                            <Button
                              disabled
                              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 font-bold text-lg py-6 shadow-lg"
                            >
                              <Timer className="h-5 w-5 mr-2" />
                              Mining... {miningData.timeRemaining}
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleActivate(machine.id)}
                              disabled={activatingMachine === machine.id}
                              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 font-bold text-lg py-6 shadow-lg"
                            >
                              {activatingMachine === machine.id ? (
                                "🔄 Activating..."
                              ) : (
                                <>
                                  <Zap className="h-5 w-5 mr-2" />
                                  Start Mining
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      ) : (
                        /* Purchase Button for non-owned machines */
                        <Button
                          onClick={() => handlePurchaseClick(machine.id)}
                          disabled={!machine.is_available || purchasing === machine.id}
                          className={`w-full bg-gradient-to-r ${gradient.button} hover:opacity-90 disabled:opacity-50 font-bold text-lg py-6 shadow-lg`}
                        >
                          {!machine.is_available ? "Coming Soon" : purchasing === machine.id ? "Processing..." : "Buy Now"}
                        </Button>
                      )}

                      {/* Watch Ad Button (Optional) */}
                      {onWatchAd && machine.is_available && miningStatus.owned && !miningData?.isActive && (
                        <Button
                          onClick={() => onWatchAd(machine.id, machine.name)}
                          className="w-full bg-cyan-500 hover:bg-cyan-600 font-bold text-lg py-3 shadow-lg"
                        >
                          Watch Ad
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
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
            name: user.username || "",
            phone: user.phone || ""
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </>
  )
}