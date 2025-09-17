"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { authService } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Zap, TrendingUp, Star, Clock, DollarSign, Cpu, Play, BarChart3 } from "lucide-react"
import { toast } from "sonner"

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
}

// ✅ Add props interface to accept onWatchAd
interface MachineMarketplaceProps {
  onWatchAd?: (machineId: string, machineName: string) => void
}

// ✅ Update function signature to accept props
export function MachineMarketplace({ onWatchAd }: MachineMarketplaceProps) {
  const { user, refreshUser } = useAuth()
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [images, setImages] = useState<Record<string, string>>({})

  const machines: MachineType[] = [
    // --- all 8 machines exactly as you wrote ---
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
      gradient: "from-blue-500 to-cyan-500",
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
      gradient: "from-purple-500 to-pink-500",
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
      gradient: "from-green-500 to-emerald-500",
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
      gradient: "from-orange-500 to-red-500",
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
      gradient: "from-red-500 to-pink-500",
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
      gradient: "from-yellow-500 to-amber-500",
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
      gradient: "from-indigo-500 to-purple-500",
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
      gradient: "from-pink-500 to-rose-500",
    },
  ]

  // ---------- MODIFIED: use local public/images mapping ----------
  useEffect(() => {
    const mapping: Record<string, string> = {
      "1": "/images/Generated Image September 15, 2025 - 7_42PM.png",
      "2": "/images/Generated Image September 15, 2025 - 8_10PM.png",
      "3": "/images/Generated Image September 16, 2025 - 1_23PM.png",
      "4": "/images/Generated Image September 16, 2025 - 1_30PM.png",
      "5": "/images/Generated Image September 16, 2025 - 1_56PM.png",
      "6": "/images/Generated Image September 15, 2025 - 7_36PM.png",
      "7": "/images/Generated Image September 16, 2025 - 1_56PM(2).png",
      "8": "/images/Generated Image September 16, 2025 - 1_56PM(3).png",
    }
    setImages(mapping)
  }, [])
  // ---------------------------------------------------------------

  const handlePurchase = async (machineId: string) => {
    if (!user) return

    const machine = machines.find((m) => m.id === machineId)
    if (!machine) return

    const userBalanceXAF = (user.wallet_balance ?? 0) * 600
    if (userBalanceXAF < machine.price) {
      toast.error("Insufficient balance. Please deposit funds to purchase this machine.")
      return
    }

    setPurchasing(machineId)
    try {
      const result = await authService.purchaseMachine(user.id, machineId)
      if (result.success) {
        await refreshUser()
        toast.success(`${machine.name} purchased successfully! Start earning now by watching ads.`)
      } else {
        toast.error(result.error || "Purchase failed")
      }
    } catch (error) {
      console.error(error)
      toast.error("An error occurred during purchase")
    } finally {
      setPurchasing(null)
    }
  }

  const getMachineIcon = (index: number) => {
    const icons = [Zap, Cpu, Star, TrendingUp, DollarSign, BarChart3, Play, Star]
    const IconComponent = icons[index % icons.length]
    return <IconComponent className="h-8 w-8 text-white" />
  }

  if (!user) return null

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ShoppingCart className="h-6 w-6 text-cyan-400" />
          <span className="text-2xl">AI Gaming Machine Marketplace</span>
        </CardTitle>
        <p className="text-slate-400 text-base mt-2">
          Purchase AI-powered gaming machines with ultra-realistic 4K animations that automatically watch ads and earn
          you money 24/7. Each machine features cutting-edge gaming aesthetics and operates independently.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {machines.map((machine, index) => {
            const insufficientFunds = (user.wallet_balance ?? 0) * 600 < machine.price
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
                    ) : (
                      <Badge
                        variant="secondary"
                        className={`bg-gradient-to-r ${machine.gradient} text-white border-0 font-bold text-sm px-3 py-1`}
                      >
                        10 days ROI
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Machine Image */}
                  <div
                    className={`aspect-square bg-gradient-to-br ${machine.gradient} rounded-xl flex items-center justify-center relative overflow-hidden shadow-lg transform transition-transform duration-500 hover:scale-105 hover:rotate-1`}
                  >
                    <div className="absolute inset-0 bg-black/10"></div>
                    <img
                      src={images[machine.id] || "/placeholder.svg"}
                      alt={machine.name}
                      className="w-full h-full object-cover rounded-xl transition-transform duration-500 hover:scale-110 hover:rotate-1"
                    />
                    <div className="absolute top-3 right-3">
                      <div
                        className={`w-3 h-3 ${!machine.is_available ? "bg-amber-400" : "bg-green-400"} rounded-full animate-pulse shadow-lg`}
                      ></div>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <div className={`p-2 bg-gradient-to-r ${machine.gradient} rounded-lg shadow-lg`}>
                        {getMachineIcon(index)}
                      </div>
                    </div>
                  </div>

                  {/* Description & Features */}
                  <div>
                    <p className="text-sm text-slate-300 leading-relaxed mb-3">{machine.description}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {machine.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-xs text-slate-400">
                          <div className={`w-1.5 h-1.5 bg-gradient-to-r ${machine.gradient} rounded-full`}></div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Earnings */}
                  <div className="bg-slate-700/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-green-400">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-bold text-lg">{machine.daily_earning_rate.toLocaleString()} XAF</span>
                      </div>
                      <div className="text-xs text-slate-400">per day</div>
                    </div>

                    <div className="text-center">
                      <div className="text-xs text-slate-400 mb-1">Monthly Potential</div>
                      <div className="text-amber-400 font-bold text-lg">
                        {machine.monthly_earning.toLocaleString()} XAF
                      </div>
                    </div>

                    <div className="flex items-center justify-center space-x-4 text-xs text-slate-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>24/7 Operation</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3" />
                        <span>4K Gaming AI</span>
                      </div>
                    </div>
                  </div>

                  {/* Purchase */}
                  <div className="space-y-4">
                    <div className="text-center bg-slate-800/50 rounded-lg p-4">
                      <div className="text-3xl font-bold text-white mb-1">{machine.price.toLocaleString()} XAF</div>
                      <div className="text-sm text-slate-400">${(machine.price / 600).toFixed(2)} USD equivalent</div>
                    </div>

                    <Button
                      onClick={() => handlePurchase(machine.id)}
                      disabled={!machine.is_available || purchasing === machine.id || insufficientFunds}
                      className={`w-full bg-gradient-to-r ${machine.gradient} hover:opacity-90 disabled:opacity-50 font-bold text-lg py-6 shadow-lg`}
                    >
                      {!machine.is_available ? "Coming Soon" : purchasing === machine.id ? "Purchasing..." : "Buy Now"}
                    </Button>

                    {/* ✅ Add Watch Ad button if onWatchAd prop exists */}
                    {onWatchAd && machine.is_available && (
                      <Button
                        onClick={() => onWatchAd(machine.id, machine.name)}
                        className={`w-full bg-cyan-500 hover:bg-cyan-600 font-bold text-lg py-3 mt-2 shadow-lg`}
                      >
                        Watch Ad
                      </Button>
                    )}

                    {insufficientFunds && machine.is_available && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <p className="text-xs text-red-400 text-center">
                          Need {(machine.price - (user?.wallet_balance ?? 0) * 600).toLocaleString()} XAF more
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ROI */}
                  <div className="bg-slate-700/20 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-2 font-semibold">Return on Investment</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400">Break even: </span>
                        <span className="text-green-400 font-bold">10 days</span>
                      </div>
                      <div>
                        <span className="text-slate-400">10x return: </span>
                        <span className="text-amber-400 font-bold">30 days</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Info Section */}
        <div className="mt-8 p-6 bg-slate-800/30 rounded-xl">
          <div className="text-slate-300 space-y-3">
            <h3 className="font-bold text-cyan-400 text-lg mb-4">How AI Gaming Machines Work:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p>• Each machine features ultra-realistic 4K gaming animations</p>
                <p>• Machines automatically watch targeted advertisements 24/7</p>
                <p>• Earnings are credited to your ED balance in real-time</p>
                <p>• Convert ED to USD anytime through the wallet section</p>
              </div>
              <div className="space-y-2">
                <p>• Higher-tier machines access premium ad networks</p>
                <p>• All machines guarantee 10x your investment in 30 days</p>
                <p>• Break even in just 10 days with consistent operation</p>
                <p>• Advanced AI optimizes earnings automatically</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="font-bold text-amber-400 mb-2">Withdrawal Rules:</p>
              <p className="text-sm">• New users must wait 1 month before first withdrawal</p>
              <p className="text-sm">• After first withdrawal, you can cash out weekly based on your payment method</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
