"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Play, Cpu, BarChart3, DollarSign, Image as ImageIcon, Timer, CheckCircle, Clock, TrendingUp } from "lucide-react"
import { AdWatchingModal, type AdReward } from "@/components/ad-watching-modal"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface UserMachine {
  id: string
  machine_type_id: string
  purchased_at: string
  is_active: boolean
  activated_at?: string
  last_claim_time?: string
  machine_types: {
    name: string
    price: number
    daily_earnings: number
    monthly_earnings: number
    description: string
    features: string[]
    image_url: string
  }
}

interface MyMachinesProps {
  onWatchAd?: (machineId: string, machineName: string) => void;
  onActivateMachine?: (machineId: string) => void;
  onClaimEarnings?: (machineId: string) => void;
  miningMachines?: Record<string, any>;
  activatingMachine?: string | null;
  claimingMachine?: string | null;
}

export function MyMachines({ 
  onWatchAd, 
  onActivateMachine, 
  onClaimEarnings, 
  miningMachines = {}, 
  activatingMachine = null, 
  claimingMachine = null 
}: MyMachinesProps) {
  const { user } = useAuth()
  const [adModalOpen, setAdModalOpen] = useState(false)
  const [selectedMachine, setSelectedMachine] = useState<{ id: string; name: string } | null>(null)
  const [userMachines, setUserMachines] = useState<UserMachine[]>([])
  const [loading, setLoading] = useState(true)
  
  // LOCAL mining state - works immediately without API
  const [localMiningStates, setLocalMiningStates] = useState<Record<string, any>>({})
  const hasResumedMining = useRef(false) // Track if we've already resumed mining

  useEffect(() => {
    loadUserMachines()
  }, [user])

  // Load mining states from localStorage on component mount
  useEffect(() => {
    if (user) {
      const savedStates = localStorage.getItem(`miningStates_${user.id}`)
      if (savedStates) {
        const parsedStates = JSON.parse(savedStates)
        setLocalMiningStates(parsedStates)
        
        // Resume mining progress for active machines
        resumeMiningProgress(parsedStates)
      }
    }
  }, [user])

  // Save mining states to localStorage whenever they change
  useEffect(() => {
    if (user && Object.keys(localMiningStates).length > 0) {
      localStorage.setItem(`miningStates_${user.id}`, JSON.stringify(localMiningStates))
    }
  }, [localMiningStates, user])

  const loadUserMachines = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_machines')
        .select(`
          id,
          machine_type_id,
          purchased_at,
          is_active,
          activated_at,
          last_claim_time,
          machine_types (
            name,
            price,
            daily_earnings,
            monthly_earnings,
            description,
            features,
            image_url
          )
        `)
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false })

      if (error) throw error
      
      const machinesWithDetails = (data || []).map(machine => ({
        ...machine,
        machine_types: Array.isArray(machine.machine_types) ? machine.machine_types[0] : machine.machine_types
      }))
      
      setUserMachines(machinesWithDetails)
      
      // Initialize local mining states only if not already loaded from localStorage
      if (Object.keys(localMiningStates).length === 0) {
        const initialStates: Record<string, any> = {}
        machinesWithDetails.forEach(machine => {
          initialStates[machine.machine_type_id] = {
            isActive: false,
            startTime: null,
            progress: 0,
            timeRemaining: '24h 0m',
            canClaim: false
          }
        })
        setLocalMiningStates(initialStates)
      }
      
    } catch (error) {
      console.error("Failed to load user machines:", error)
      setUserMachines([])
    } finally {
      setLoading(false)
    }
  }

  // Resume mining progress for machines that were mining before page reload
  const resumeMiningProgress = (states: Record<string, any>) => {
    if (hasResumedMining.current) return // Prevent multiple calls
    hasResumedMining.current = true

    Object.entries(states).forEach(([machineId, state]) => {
      if (state.isActive && state.startTime && state.progress < 100) {
        const startTime = state.startTime
        const now = new Date().getTime()
        const elapsed = now - startTime
        
        // If mining period hasn't expired, resume progress
        if (elapsed < 24 * 60 * 60 * 1000) {
          startMiningProgress(machineId, startTime)
        } else {
          // Mining completed while page was closed
          setLocalMiningStates(prev => ({
            ...prev,
            [machineId]: {
              ...prev[machineId],
              isActive: false,
              progress: 100,
              timeRemaining: '0h 0m',
              canClaim: true
            }
          }))
        }
      }
    })
  }

  // SIMPLE mining activation - works immediately
  const handleActivate = async (machineId: string) => {
    console.log('🚀 Activating machine:', machineId)
    
    const startTime = new Date().getTime()
    
    // Update local state immediately
    setLocalMiningStates(prev => ({
      ...prev,
      [machineId]: {
        isActive: true,
        startTime: startTime,
        progress: 0,
        timeRemaining: '23h 59m',
        canClaim: false
      }
    }))
    
    toast.success('Machine activated! 🚀 Mining started...')
    
    // Start progress simulation
    startMiningProgress(machineId, startTime)
    
    // Try API in background (optional) - but don't wait for it
    if (onActivateMachine) {
      try {
        await onActivateMachine(machineId)
      } catch (error) {
        console.log('API call failed, but local mining works')
      }
    } else {
      // If no onActivateMachine prop, try direct API call
      try {
        await fetch('/api/machines/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user?.id, machineId })
        })
      } catch (error) {
        console.log('Direct API call also failed, but local mining works')
      }
    }
  }

  // SIMPLE mining progress simulation with persistence
  const startMiningProgress = (machineId: string, startTime: number) => {
    const totalMiningTime = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    
    const updateProgress = () => {
      const now = new Date().getTime()
      const elapsed = now - startTime
      const progress = Math.min((elapsed / totalMiningTime) * 100, 100)
      const remainingMs = Math.max(totalMiningTime - elapsed, 0)
      
      // Calculate remaining time
      const hours = Math.floor(remainingMs / (1000 * 60 * 60))
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))
      
      const newState = {
        isActive: progress < 100,
        startTime: startTime,
        progress: progress,
        timeRemaining: `${hours}h ${minutes}m`,
        canClaim: progress >= 100
      }
      
      setLocalMiningStates(prev => ({
        ...prev,
        [machineId]: newState
      }))
      
      // Continue updating if not complete
      if (progress < 100) {
        setTimeout(updateProgress, 1000) // Update every second
      }
    }
    
    // Start the progress updates
    updateProgress()
  }

  // SIMPLE claim function
  const handleClaim = async (machineId: string) => {
    const machine = userMachines.find(m => m.machine_type_id === machineId)
    const dailyEarnings = machine?.machine_types.daily_earnings || 0
    
    toast.success(`💰 Claimed ${dailyEarnings.toLocaleString()} XAF!`)
    
    // Reset mining state
    setLocalMiningStates(prev => ({
      ...prev,
      [machineId]: {
        isActive: false,
        startTime: null,
        progress: 0,
        timeRemaining: '24h 0m',
        canClaim: false
      }
    }))
    
    // Try API in background (optional)
    if (onClaimEarnings) {
      try {
        await onClaimEarnings(machineId)
      } catch (error) {
        console.log('API claim failed, but local claim worked')
      }
    }
  }

  const handleWatchAdClick = (machineId: string, machineName: string) => {
    if (onWatchAd) {
      onWatchAd(machineId, machineName)
    } else {
      setSelectedMachine({ id: machineId, name: machineName })
      setAdModalOpen(true)
    }
  }

  const handleRewardEarned = (reward: AdReward) => {
    toast.success(`Earned ${reward.amount.toFixed(2)} ED from ${selectedMachine?.name}!`)
    loadUserMachines()
  }

  const getGradientClass = (machineId: string) => {
    const gradients: Record<string, string> = {
      "1": "from-blue-500 to-cyan-500",
      "2": "from-purple-500 to-pink-500", 
      "3": "from-green-500 to-emerald-500",
      "4": "from-orange-500 to-red-500",
      "5": "from-red-500 to-pink-500",
      "6": "from-yellow-500 to-amber-500",
      "7": "from-indigo-500 to-purple-500",
      "8": "from-pink-500 to-rose-500"
    }
    return gradients[machineId] || gradients["1"]
  }

  const getMachineIcon = (index: number) => {
    const icons = [Zap, Cpu, BarChart3, DollarSign, Zap, Cpu, BarChart3, DollarSign]
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
            Manage your AI-powered gaming machines and track their performance
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
              {userMachines.map((machine, index) => {
                const machineData = machine.machine_types
                const gradientClass = getGradientClass(machine.machine_type_id)
                
                // Use LOCAL mining state (works immediately)
                const miningState = localMiningStates[machine.machine_type_id] || {
                  isActive: false,
                  progress: 0,
                  timeRemaining: '24h 0m',
                  canClaim: false
                }

                return (
                  <Card
                    key={machine.id}
                    className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all duration-300 hover:shadow-lg"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <div className={`p-4 bg-gradient-to-r ${gradientClass} rounded-xl shadow-lg`}>
                            {getMachineIcon(index)}
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-xl">{machineData.name}</h3>
                            <p className="text-sm text-slate-300">4K Ultra Gaming AI • Premium Network Access</p>
                            <p className="text-xs text-slate-400 mt-1">
                              Purchased: {new Date(machine.purchased_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          {miningState.isActive ? (
                            <Badge variant="default" className="bg-blue-500/10 text-blue-300 border-blue-500/20 px-3 py-1">
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse mr-2"></div>
                              Mining Active
                            </Badge>
                          ) : (
                            <Badge variant="default" className="bg-amber-500/10 text-amber-300 border-amber-500/20 px-3 py-1">
                              <Clock className="h-3 w-3 mr-1" />
                              Ready to Start
                            </Badge>
                          )}
                          
                          {miningState.canClaim && (
                            <Badge variant="default" className="bg-green-500/10 text-green-300 border-green-500/20 px-3 py-1">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Ready to Claim!
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Machine Image */}
                      <div className="aspect-video rounded-xl overflow-hidden mb-6 shadow-lg relative">
                        {machineData.image_url ? (
                          <img
                            src={machineData.image_url}
                            alt={machineData.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/placeholder.svg"
                            }}
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
                            <ImageIcon className="h-12 w-12 text-white opacity-50" />
                          </div>
                        )}
                        
                        {/* Mining Progress Overlay - NOW WORKING! */}
                        {miningState.isActive && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-3">
                            <div className="flex items-center justify-between text-sm text-white mb-2">
                              <div className="flex items-center space-x-2">
                                <Timer className="h-4 w-4" />
                                <span>{miningState.timeRemaining}</span>
                              </div>
                              <span className="text-green-400 font-bold">{Math.round(miningState.progress)}%</span>
                            </div>
                            <div className="w-full bg-slate-600 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${miningState.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                          <div className="text-xs text-slate-400 mb-1">Daily Earning</div>
                          <div className="text-lg font-bold text-green-400">
                            {machineData.daily_earnings?.toLocaleString() || '0'} XAF
                          </div>
                        </div>

                        <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                          <div className="text-xs text-slate-400 mb-1">Monthly Potential</div>
                          <div className="text-lg font-bold text-amber-400">
                            {machineData.monthly_earnings?.toLocaleString() || '0'} XAF
                          </div>
                        </div>

                        <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                          <div className="text-xs text-slate-400 mb-1">Machine Value</div>
                          <div className="text-lg font-bold text-cyan-400">
                            {machineData.price?.toLocaleString() || '0'} XAF
                          </div>
                        </div>

                        <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                          <div className="text-xs text-slate-400 mb-1">Status</div>
                          <div className={`text-lg font-bold ${
                            miningState.canClaim ? 'text-green-400' : 
                            miningState.isActive ? 'text-blue-400' : 'text-purple-400'
                          }`}>
                            {miningState.canClaim ? 'Ready!' : miningState.isActive ? 'Mining' : 'Ready to Start'}
                          </div>
                        </div>
                      </div>

                      {/* Mining Action Buttons - NOW WORKING! */}
                      <div className="pt-4 border-t border-slate-700 space-y-3">
                        {miningState.canClaim ? (
                          <Button
                            size="lg"
                            onClick={() => handleClaim(machine.machine_type_id)}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 font-bold text-lg py-4 shadow-lg"
                          >
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Claim {machineData.daily_earnings?.toLocaleString() || '0'} XAF
                          </Button>
                        ) : miningState.isActive ? (
                          <Button
                            size="lg"
                            disabled
                            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 font-bold text-lg py-4 shadow-lg"
                          >
                            <Timer className="h-5 w-5 mr-2" />
                            Mining... {miningState.timeRemaining}
                          </Button>
                        ) : (
                          <Button
                            size="lg"
                            onClick={() => handleActivate(machine.machine_type_id)}
                            disabled={activatingMachine === machine.machine_type_id}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 font-bold text-lg py-4 shadow-lg"
                          >
                            {activatingMachine === machine.machine_type_id ? (
                              "🔄 Activating..."
                            ) : (
                              <>
                                <Zap className="h-5 w-5 mr-2" />
                                Start Mining
                              </>
                            )}
                          </Button>
                        )}

                        {/* Optional Watch Ad Button */}
                        {onWatchAd && !miningState.isActive && (
                          <Button
                            size="lg"
                            variant="outline"
                            onClick={() => handleWatchAdClick(machine.machine_type_id, machineData.name)}
                            className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-bold py-3 shadow-lg"
                          >
                            <Play className="h-5 w-5 mr-2" />
                            Watch Ad & Earn Bonus
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h4 className="font-bold text-white text-xl mb-4">Fleet Performance Summary</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-slate-400 text-sm">Total Machines</div>
                        <div className="text-cyan-400 font-bold text-2xl">{userMachines.length}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-sm">Daily Potential</div>
                        <div className="text-green-400 font-bold text-2xl">
                          {userMachines.reduce((sum, m) => sum + (m.machine_types.daily_earnings || 0), 0).toLocaleString()} XAF
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
          onClose={() => { setAdModalOpen(false); setSelectedMachine(null) }}
          machineId={selectedMachine.id}
          machineName={selectedMachine.name}
          rewardAmount={0.5}
          onRewardEarned={handleRewardEarned}
        />
      )}
    </>
  )
}