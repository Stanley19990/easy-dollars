"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Play, Clock, TrendingUp, Star, Cpu, BarChart3, DollarSign } from "lucide-react"
import { AdWatchingModal } from "@/components/ad-watching-modal"
import { adMobService, type AdReward } from "@/lib/admob-service"
import { toast } from "sonner"
import { authService } from "@/lib/auth"

interface UserMachine {
  id: string
  name: string
  price: number
  daily_earning_rate: number
  monthly_earning: number
  description: string
  features: string[]
  image_query: string
  gradient: string
  adsWatchedToday: number
  maxAdsPerDay: number
  totalEarned: number
  isActive: boolean
}

export function MyMachines() {
  const { user, refreshUser } = useAuth()
  const [adModalOpen, setAdModalOpen] = useState(false)
  const [selectedMachine, setSelectedMachine] = useState<{ id: string; name: string } | null>(null)
  const [userMachines, setUserMachines] = useState<UserMachine[]>([])
  const [loading, setLoading] = useState(true)

  const machineSpecs = {
    "1": {
      name: "AI Gaming Starter Pro",
      price: 2500,
      daily_earning_rate: 900,
      monthly_earning: 27000,
      description:
        "Entry-level AI gaming machine with stunning 4K holographic displays and neural networks for optimal ad targeting.",
      features: ["4K Holographic Display", "Neural Ad Targeting", "24/7 Operation", "Real-time Tracking"],
      image_query: "futuristic blue holographic AI gaming machine with glowing circuits and 4K displays",
      gradient: "from-blue-500 to-cyan-500",
    },
    "2": {
      name: "Smart Gaming Engine X1",
      price: 5000,
      daily_earning_rate: 1650,
      monthly_earning: 49500,
      description: "Enhanced AI gaming system with premium 4K animations and smart targeting algorithms.",
      features: ["Premium 4K Animations", "Smart Algorithms", "Holographic Interface", "Bonus Multipliers"],
      image_query: "purple smart gaming AI engine with holographic interface and glowing energy cores",
      gradient: "from-purple-500 to-pink-500",
    },
    "3": {
      name: "Quantum Gaming Processor",
      price: 10000,
      daily_earning_rate: 3500,
      monthly_earning: 105000,
      description: "High-performance gaming AI with quantum-level 4K animations and multiple stream processing.",
      features: ["Quantum Processing", "Multiple Streams", "Ultra-realistic Visuals", "VIP Ad Access"],
      image_query: "green quantum gaming processor with energy particles and advanced holographic displays",
      gradient: "from-green-500 to-emerald-500",
    },
    "4": {
      name: "Neural Gaming Maximizer",
      price: 15000,
      daily_earning_rate: 5000,
      monthly_earning: 150000,
      description: "Professional-grade gaming AI with deep learning and 4K ultra-realistic animations.",
      features: ["Deep Learning AI", "Ultra-realistic 4K", "Exclusive Networks", "Advanced Analytics"],
      image_query: "orange neural gaming maximizer with brain-like patterns and glowing neural networks",
      gradient: "from-orange-500 to-red-500",
    },
    "5": {
      name: "Hyper Gaming Intelligence",
      price: 25000,
      daily_earning_rate: 8333,
      monthly_earning: 250000,
      description: "Ultimate gaming AI with superintelligent algorithms and 4K ultra-realistic animations.",
      features: ["Superintelligent AI", "Premium Networks", "White-glove Support", "Exclusive Aesthetics"],
      image_query: "red hyper gaming intelligence machine with energy beams and advanced holographic displays",
      gradient: "from-red-500 to-pink-500",
    },
    "6": {
      name: "Elite Gaming Matrix",
      price: 50000,
      daily_earning_rate: 16666,
      monthly_earning: 500000,
      description: "Revolutionary gaming AI with 8K ultra-realistic animations and matrix-level processing.",
      features: ["8K Ultra-realistic", "Matrix Processing", "Next-gen Aesthetics", "Quantum Optimization"],
      image_query: "golden elite gaming matrix with circuit patterns and holographic gaming interface",
      gradient: "from-yellow-500 to-amber-500",
    },
  }

  useEffect(() => {
    loadUserMachines()
  }, [user])

  const loadUserMachines = async () => {
    if (!user) return

    try {
      const ownedMachines = await authService.getUserMachines(user.id)
      setUserMachines(
        ownedMachines.map((machine) => {
          const spec = machineSpecs[machine.id as keyof typeof machineSpecs]
          return {
            ...machine,
            ...spec,
            adsWatchedToday: adMobService.getTodayAdCount(user.id, machine.id),
            maxAdsPerDay: 20,
            totalEarned: spec.daily_earning_rate * 15, // Mock total earned
            isActive: true,
          }
        }),
      )
    } catch (error) {
      console.error("Failed to load user machines:", error)
      setUserMachines([])
    } finally {
      setLoading(false)
    }
  }

  const handleWatchAd = (machineId: string, machineName: string) => {
    if (!user) return

    if (!adMobService.canWatchAd(user.id, machineId)) {
      toast.error("Daily ad limit reached for this machine")
      return
    }

    setSelectedMachine({ id: machineId, name: machineName })
    setAdModalOpen(true)
  }

  const handleRewardEarned = (reward: AdReward) => {
    toast.success(`Earned ${reward.amount.toFixed(2)} ED from ${selectedMachine?.name}!`)

    if (user) {
      const updatedUser = { ...user }
      updatedUser.edBalance = (updatedUser.edBalance ?? 0) + reward.amount
      updatedUser.totalEarned = (updatedUser.totalEarned ?? 0) + reward.amount
      localStorage.setItem("easy_dollars_user", JSON.stringify(updatedUser))
      refreshUser()
    }
  }

  const getMachineIcon = (index: number) => {
    const icons = [Zap, Cpu, Star, TrendingUp, BarChart3, DollarSign]
    const IconComponent = icons[index % icons.length]
    return <IconComponent className="h-6 w-6 text-white" />
  }

  if (loading) {
    return (
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-purple-400" />
            <span className="text-white">My AI Gaming Machines</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-purple-400" />
            <span className="text-xl text-white">My AI Gaming Machines</span>
          </CardTitle>
          <p className="text-slate-300 text-sm">
            Manage your AI-powered gaming machines and track their performance with real-time analytics
          </p>
        </CardHeader>
        <CardContent>
          {userMachines.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <div className="bg-slate-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-10 w-10 opacity-50" />
              </div>
              <p className="text-slate-300 text-lg font-semibold mb-2">No machines owned yet</p>
              <p className="text-sm text-slate-400">
                Purchase your first AI gaming machine to start earning automatically!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {userMachines.map((machine, index) => (
                <Card
                  key={machine.id}
                  className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all duration-300 hover:shadow-lg"
                >
                  <CardContent className="p-6">
                    {/* Machine Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className={`p-4 bg-gradient-to-r ${machine.gradient} rounded-xl shadow-lg`}>
                          {getMachineIcon(index)}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-xl">{machine.name}</h3>
                          <p className="text-sm text-slate-300">4K Ultra Gaming AI • Premium Network Access</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Machine Cost: {machine.price.toLocaleString()} XAF
                          </p>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-500/10 text-green-300 border-green-500/20 px-3 py-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                        Active
                      </Badge>
                    </div>

                    {/* Machine Image */}
                    <div
                      className={`aspect-video bg-gradient-to-br ${machine.gradient} rounded-xl flex items-center justify-center relative overflow-hidden mb-6 shadow-lg`}
                    >
                      <img
                        src={`/placeholder.svg?height=300&width=500&query=${encodeURIComponent(machine.image_query)}`}
                        alt={machine.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <div className="absolute top-3 right-3">
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                      </div>
                      <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
                        <span className="text-white text-sm font-semibold">Live Operation</span>
                      </div>
                    </div>

                    {/* Machine Description & Features */}
                    <div className="mb-6">
                      <p className="text-sm text-slate-300 leading-relaxed mb-4">{machine.description}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {machine.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-xs text-slate-400">
                            <div className={`w-2 h-2 bg-gradient-to-r ${machine.gradient} rounded-full`}></div>
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Performance Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                      <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                        <div className="text-xs text-slate-400 mb-1">Daily Earning</div>
                        <div className="text-lg font-bold text-green-400">
                          {machine.daily_earning_rate.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500">XAF per day</div>
                      </div>

                      <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                        <div className="text-xs text-slate-400 mb-1">Monthly Potential</div>
                        <div className="text-lg font-bold text-amber-400">
                          {machine.monthly_earning.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500">XAF per month</div>
                      </div>

                      <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                        <div className="text-xs text-slate-400 mb-1">Ads Today</div>
                        <div className="text-lg font-bold text-cyan-400">
                          {machine.adsWatchedToday}/{machine.maxAdsPerDay}
                        </div>
                        <div className="text-xs text-slate-500">watched</div>
                      </div>

                      <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                        <div className="text-xs text-slate-400 mb-1">Total Earned</div>
                        <div className="text-lg font-bold text-purple-400">{machine.totalEarned.toLocaleString()}</div>
                        <div className="text-xs text-slate-500">XAF total</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm text-slate-400 mb-2">
                        <span>Daily Progress</span>
                        <span>{Math.round((machine.adsWatchedToday / machine.maxAdsPerDay) * 100)}% Complete</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-3">
                        <div
                          className={`bg-gradient-to-r ${machine.gradient} h-3 rounded-full transition-all duration-500 shadow-sm`}
                          style={{
                            width: `${Math.min((machine.adsWatchedToday / machine.maxAdsPerDay) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-4 border-t border-slate-700">
                      {machine.adsWatchedToday < machine.maxAdsPerDay ? (
                        <Button
                          size="lg"
                          onClick={() => handleWatchAd(machine.id, machine.name)}
                          className={`w-full bg-gradient-to-r ${machine.gradient} hover:opacity-90 font-bold text-lg py-4 shadow-lg`}
                        >
                          <Play className="h-5 w-5 mr-2" />
                          Watch Ad ({machine.maxAdsPerDay - machine.adsWatchedToday} remaining)
                        </Button>
                      ) : (
                        <div className="text-center">
                          <Button size="lg" disabled className="w-full mb-3 py-4">
                            <Clock className="h-5 w-5 mr-2" />
                            Daily limit reached
                          </Button>
                          <p className="text-sm text-slate-400">Resets in {24 - new Date().getHours()} hours</p>
                        </div>
                      )}
                    </div>

                    {/* ROI Information */}
                    <div className="mt-6 bg-slate-700/20 rounded-lg p-4">
                      <div className="text-sm text-slate-400 mb-3 font-semibold">Performance Insights</div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <span className="text-slate-400 block">Break Even</span>
                          <span className="text-green-400 font-bold text-lg">10 days</span>
                        </div>
                        <div className="text-center">
                          <span className="text-slate-400 block">10x Return</span>
                          <span className="text-amber-400 font-bold text-lg">30 days</span>
                        </div>
                        <div className="text-center">
                          <span className="text-slate-400 block">Efficiency</span>
                          <span className="text-cyan-400 font-bold text-lg">98.5%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Fleet Summary */}
              <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h4 className="font-bold text-white text-xl mb-4">Fleet Performance Summary</h4>
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <div className="text-slate-400 text-sm">Total Machines</div>
                        <div className="text-cyan-400 font-bold text-2xl">{userMachines.length}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-sm">Daily Potential</div>
                        <div className="text-green-400 font-bold text-2xl">
                          {userMachines.reduce((sum, m) => sum + m.daily_earning_rate, 0).toLocaleString()} XAF
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-sm">Total Investment</div>
                        <div className="text-amber-400 font-bold text-2xl">
                          {userMachines.reduce((sum, m) => sum + m.price, 0).toLocaleString()} XAF
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedMachine && (
        <AdWatchingModal
          isOpen={adModalOpen}
          onClose={() => {
            setAdModalOpen(false)
            setSelectedMachine(null)
          }}
          machineId={selectedMachine.id}
          machineName={selectedMachine.name}
          onRewardEarned={handleRewardEarned}
        />
      )}
    </>
  )
}
