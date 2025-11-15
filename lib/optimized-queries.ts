// lib/optimized-queries.ts
import { supabase } from './supabase'

// Optimized referrals query
export const getOptimizedReferrals = async (userId: string) => {
  return supabase
    .from('referrals')
    .select(`
      id,
      referred_id,
      bonus,
      referral_date
    `)
    .eq('referrer_id', userId)
    .order('referral_date', { ascending: false })
    .limit(50)
}

// Optimized user machines query
export const getOptimizedUserMachines = async (userId: string) => {
  return supabase
    .from('user_machines')
    .select(`
      id,
      machine_type_id,
      purchased_at,
      is_active,
      activated_at,
      last_claim_time,
      total_earned
    `)
    .eq('user_id', userId)
    .order('purchased_at', { ascending: false })
}

// Optimized machine types (cache this)
let machineTypesCache: any[] | null = null
let cacheTimestamp: number = 0

export const getOptimizedMachineTypes = async () => {
  // Cache for 5 minutes
  if (machineTypesCache && Date.now() - cacheTimestamp < 300000) {
    return { data: machineTypesCache, error: null }
  }

  const result = await supabase
    .from('machine_types')
    .select('*')
    .order('id')
  
  if (result.data) {
    machineTypesCache = result.data
    cacheTimestamp = Date.now()
  }
  
  return result
}

// Batch user data fetch
export const getOptimizedUserData = async (userId: string) => {
  return supabase
    .from('users')
    .select(`
      id,
      wallet_balance,
      ed_balance,
      total_earned,
      machines_owned,
      referral_code
    `)
    .eq('id', userId)
    .single()
}