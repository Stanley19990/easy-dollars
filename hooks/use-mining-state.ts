import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"

interface MiningState {
  isActive: boolean
  startTime: number | null
  progress: number
  timeRemaining: string
  canClaim: boolean
  totalEarned: number
  isNewMachine: boolean
}

interface MiningStates {
  [machineId: string]: MiningState
}

export function useMiningState() {
  const { user } = useAuth()
  const [miningStates, setMiningStates] = useState<MiningStates>({})
  const [localClaiming, setLocalClaiming] = useState<string | null>(null)

  // Load mining states from localStorage on mount
  useEffect(() => {
    if (user) {
      const savedStates = localStorage.getItem(`miningStates_${user.id}`)
      if (savedStates) {
        const parsedStates = JSON.parse(savedStates)
        setMiningStates(parsedStates)
        resumeMiningProgress(parsedStates)
      }
    }
  }, [user])

  // Save mining states to localStorage whenever they change
  useEffect(() => {
    if (user && Object.keys(miningStates).length > 0) {
      localStorage.setItem(`miningStates_${user.id}`, JSON.stringify(miningStates))
    }
  }, [miningStates, user])

  // Resume mining progress for machines that were mining before page reload
  const resumeMiningProgress = useCallback((states: MiningStates) => {
    Object.entries(states).forEach(([machineId, state]) => {
      if (state.isActive && state.startTime && state.progress < 100) {
        const startTime = state.startTime
        const now = new Date().getTime()
        const elapsed = now - startTime
        
        if (elapsed < 24 * 60 * 60 * 1000) {
          startMiningProgress(machineId, startTime)
        } else {
          setMiningStates(prev => ({
            ...prev,
            [machineId]: {
              ...prev[machineId],
              isActive: false,
              progress: 100,
              timeRemaining: '0h 0m',
              canClaim: true,
              isNewMachine: false
            }
          }))
        }
      }
    })
  }, [])

  // Start mining progress simulation
  const startMiningProgress = useCallback((machineId: string, startTime: number) => {
    const totalMiningTime = 24 * 60 * 60 * 1000
    
    const updateProgress = () => {
      const now = new Date().getTime()
      const elapsed = now - startTime
      const progress = Math.min((elapsed / totalMiningTime) * 100, 100)
      const remainingMs = Math.max(totalMiningTime - elapsed, 0)
      
      const hours = Math.floor(remainingMs / (1000 * 60 * 60))
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))
      
      const newState = {
        isActive: progress < 100,
        startTime: startTime,
        progress: progress,
        timeRemaining: `${hours}h ${minutes}m`,
        canClaim: progress >= 100,
        totalEarned: miningStates[machineId]?.totalEarned || 0,
        isNewMachine: false
      }
      
      setMiningStates(prev => ({
        ...prev,
        [machineId]: newState
      }))
      
      if (progress < 100) {
        setTimeout(updateProgress, 1000)
      }
    }
    
    updateProgress()
  }, [miningStates])

  // Initialize machine state
  const initializeMachineState = useCallback((machineId: string, totalEarned: number = 0, isNewMachine: boolean = true) => {
    setMiningStates(prev => ({
      ...prev,
      [machineId]: {
        isActive: false,
        startTime: null,
        progress: 0,
        timeRemaining: '24h 0m',
        canClaim: false,
        totalEarned: totalEarned,
        isNewMachine: isNewMachine
      }
    }))
  }, [])

  // Activate machine
  const activateMachine = useCallback((machineId: string) => {
    const startTime = new Date().getTime()
    
    setMiningStates(prev => ({
      ...prev,
      [machineId]: {
        isActive: true,
        startTime: startTime,
        progress: 0,
        timeRemaining: '23h 59m',
        canClaim: false,
        totalEarned: prev[machineId]?.totalEarned || 0,
        isNewMachine: false
      }
    }))
    
    startMiningProgress(machineId, startTime)
  }, [startMiningProgress])

  // Claim earnings
  const claimEarnings = useCallback(async (machineId: string, dailyEarnings: number) => {
    setLocalClaiming(machineId)
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Update local state immediately
      setMiningStates(prev => ({
        ...prev,
        [machineId]: {
          isActive: false,
          startTime: null,
          progress: 0,
          timeRemaining: '24h 0m',
          canClaim: false,
          totalEarned: (prev[machineId]?.totalEarned || 0) + dailyEarnings,
          isNewMachine: false
        }
      }))

      // Update database in background (optional, non-blocking)
      if (user) {
        updateDatabaseAfterClaim(machineId, dailyEarnings, user.id)
      }

    } catch (error) {
      console.error('Claim error:', error)
      throw error
    } finally {
      setLocalClaiming(null)
    }
  }, [user])

  // Update database in background
  const updateDatabaseAfterClaim = async (machineId: string, amount: number, userId: string) => {
    try {
      // Find the user machine record
      const { data: userMachines } = await supabase
        .from('user_machines')
        .select('id, total_earned')
        .eq('machine_type_id', machineId)
        .eq('user_id', userId)

      if (!userMachines || userMachines.length === 0) return

      const userMachine = userMachines[0]

      // Update user balance
      const { data: userData } = await supabase
        .from('users')
        .select('ed_balance, total_earned')
        .eq('id', userId)
        .single()

      if (userData) {
        await supabase
          .from('users')
          .update({
            ed_balance: (userData.ed_balance || 0) + amount,
            total_earned: (userData.total_earned || 0) + amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
      }

      // Update machine
      await supabase
        .from('user_machines')
        .update({
          last_claim_time: new Date().toISOString(),
          total_earned: (userMachine.total_earned || 0) + amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', userMachine.id)

      console.log('✅ Database updated successfully')

    } catch (error) {
      console.log('⚠️ Background database update failed, but local claim worked')
    }
  }

  return {
    miningStates,
    localClaiming,
    initializeMachineState,
    activateMachine,
    claimEarnings,
    setMiningStates
  }
}