// lib/supabase.ts
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL")
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})

// Database types that match your actual schema
export interface DatabaseUser {
  id: string
  created_at: string
  email: string
  username?: string
  full_name?: string
  avatar_url?: string
  country?: string
  phone?: string
  referral_code?: string
  referred_by?: string
  wallet_balance: number
  ed_balance: number
  total_earned: number
  machines_owned: number
  last_earning_date?: string
  social_media_completed: boolean
  completed_social_links?: string[]
  social_media_bonus_paid: boolean
}

export interface MachineType {
  id: number
  name: string
  description?: string
  price: number
  daily_earnings: number
  monthly_earnings: number
  image_url?: string
  features?: any
  is_available: boolean
  created_at: string
  gradient?: string
  image_query?: string
}

export interface UserMachine {
  id: number
  user_id: string
  machine_type_id: number
  purchased_at: string
  is_active: boolean
  updated_at: string
  ads_watched_today: number
  total_ads_watched: number
  last_ad_watched_at?: string
  daily_ad_limit: number
  total_earned: number
  total_earnings: number
  activated_at?: string
  last_claim_time?: string
  machine_types?: MachineType | MachineType[]
}

export interface Referral {
  id: number
  referrer_id: string
  referred_id: string
  referral_date: string
  bonus: number
  referred_user?: DatabaseUser | DatabaseUser[]
}

export interface Transaction {
  id: string
  user_id: string
  type: string
  description: string
  amount: number
  currency: string
  status: string
  created_at: string
  fapshi_trans_id?: string
  external_id?: string
  metadata?: any
}

export interface Earnings {
  id: number
  user_id: string
  machine_id: number
  amount: number
  earned_at: string
  type: string
  machine?: {
    name: string
  }
}

export interface Notification {
  id: number
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  action_url?: string
  created_at: string
}

// Extended types for our application
export interface AppUser extends DatabaseUser {
  user_metadata?: {
    username?: string
    full_name?: string
    phone?: string
    country?: string
  }
}

// Type alias for User
export type User = DatabaseUser

// Helper function to get user data with proper typing
export const getUserData = async (userId: string): Promise<DatabaseUser | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching user data:', error)
    return null
  }
}

// Helper function to update user balance
export const updateUserBalance = async (
  userId: string, 
  updates: { 
    wallet_balance?: number, 
    ed_balance?: number, 
    total_earned?: number 
  }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error updating user balance:', error)
    return false
  }
}

// Helper function to get user machines with machine types
export const getUserMachinesWithTypes = async (userId: string): Promise<UserMachine[]> => {
  try {
    const { data, error } = await supabase
      .from('user_machines')
      .select(`
        *,
        machine_types (*)
      `)
      .eq('user_id', userId)
      .order('purchased_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching user machines:', error)
    return []
  }
}

// Helper function to get machine types
export const getMachineTypes = async (): Promise<MachineType[]> => {
  try {
    const { data, error } = await supabase
      .from('machine_types')
      .select('*')
      .order('id')

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching machine types:', error)
    return []
  }
}

// Helper function to get user referrals
export const getUserReferrals = async (userId: string): Promise<Referral[]> => {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select(`
        *,
        referred_user:users!referrals_referred_id_fkey(
          username,
          email,
          created_at
        )
      `)
      .eq('referrer_id', userId)
      .order('referral_date', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching referrals:', error)
    return []
  }
}

// Helper function to create a transaction
export const createTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('transactions')
      .insert({
        ...transaction,
        created_at: new Date().toISOString()
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error creating transaction:', error)
    return false
  }
}

// Helper function to create earnings record
export const createEarningsRecord = async (earnings: Omit<Earnings, 'id'>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('earnings')
      .insert(earnings)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error creating earnings record:', error)
    return false
  }
}

// Helper function to get user stats
export const getUserStats = async (userId: string) => {
  try {
    const [userData, userMachines, referrals] = await Promise.all([
      getUserData(userId),
      getUserMachinesWithTypes(userId),
      getUserReferrals(userId)
    ])

    const totalMachines = userMachines.length
    const activeMachines = userMachines.filter(machine => machine.is_active).length
    const totalEarned = userData?.total_earned || 0
    const walletBalance = userData?.wallet_balance || 0
    const edBalance = userData?.ed_balance || 0
    const totalReferrals = referrals.length
    const referralBonus = referrals.reduce((sum, ref) => sum + (ref.bonus || 0), 0)

    return {
      totalMachines,
      activeMachines,
      totalEarned,
      walletBalance,
      edBalance,
      totalReferrals,
      referralBonus
    }
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return null
  }
}