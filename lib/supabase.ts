import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please add it to your .env.local file.")
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please add it to your .env.local file.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  full_name: string
  country: string
  phone?: string
  referral_code: string
  referred_by?: string
  wallet_balance: number
  ed_balance: number
  total_earned: number
  machines_owned: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MachineType {
  id: string
  name: string
  price: number
  daily_earning_rate: number
  description: string
  image_url: string
  is_active: boolean
  created_at: string
}

export interface UserMachine {
  id: string
  user_id: string
  machine_type_id: string
  purchase_date: string
  total_earned: number
  ads_watched_today: number
  last_ad_watched?: string
  is_active: boolean
  machine_types: MachineType
}

export interface Earning {
  id: string
  user_id: string
  machine_id?: string
  amount: number
  currency: string
  earning_type: string
  description?: string
  created_at: string
}

export interface Withdrawal {
  id: string
  user_id: string
  amount: number
  currency: string
  status: string
  payment_method?: string
  payment_details?: any
  requested_at: string
  processed_at?: string
}
