// hooks/use-auth.tsx - FIXED VERSION
"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    fullName: string,
    country: string,
    phone?: string,
    referralCode?: string
  ) => Promise<{ user: User | null; error: string | null }>
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: string | null }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error("Error getting session:", error)
        setUser(null)
        return
      }

      setUser(session?.user ?? null)
    } catch (error) {
      console.error("Error loading user:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [loadUser])

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    country: string,
    phone?: string,
    referralCode?: string
  ): Promise<{ user: User | null; error: string | null }> => {
    try {
      console.log("🚀 Starting signup process...")
      
      // Step 1: Create auth user (this was working)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: fullName,
            full_name: fullName,
            country,
            phone: phone || null,
          },
        },
      })

      if (error) {
        console.error("❌ Auth signup failed:", error)
        return { user: null, error: error.message }
      }

      if (!data.user) {
        return { user: null, error: "No user data returned" }
      }

      console.log("✅ Auth user created:", data.user.id)
      setUser(data.user)
      
      // Step 2: Create user profile in public.users table - IMPROVED VERSION
      try {
        // First, let's check if user already exists in public.users (safety check)
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single()

        // Only create if user doesn't exist
        if (checkError || !existingUser) {
          console.log("📝 Creating user profile in public.users...")
          
          const userProfile = {
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
            country: country,
            phone: phone || null,
            referral_code: referralCode || null,
            wallet_balance: 0,
            ed_balance: 0,
            total_earned: 0,
            machines_owned: 0,
            social_media_completed: false,
            social_media_bonus_paid: false
            // completed_social_links is handled by database default
          }

          const { error: profileError } = await supabase
            .from('users')
            .insert(userProfile)

          if (profileError) {
            console.error("❌ User profile creation failed:", profileError)
            
            // Try upsert as fallback
            const { error: upsertError } = await supabase
              .from('users')
              .upsert(userProfile)
              
            if (upsertError) {
              console.error("❌ User profile upsert also failed:", upsertError)
              // Continue anyway - auth user was created successfully
            } else {
              console.log("✅ User profile created via upsert")
            }
          } else {
            console.log("✅ User profile created successfully")
          }
        } else {
          console.log("ℹ️ User already exists in public.users, skipping creation")
        }

      } catch (profileError: any) {
        console.error("💥 Exception creating user profile:", profileError)
        // Continue anyway - the auth user was created successfully
      }

      // Step 3: Process referral if code was provided
      if (referralCode && data.user.id) {
        try {
          console.log("🔄 Processing referral code:", referralCode)
          const { ReferralService } = await import('@/lib/referral-service')
          await ReferralService.processReferralSignup(data.user.id, referralCode)
          console.log("✅ Referral processed successfully")
        } catch (referralError) {
          console.error("⚠️ Error processing referral:", referralError)
          // Don't fail signup if referral processing fails
        }
      }

      console.log("🎉 Signup completed successfully!")
      return { user: data.user, error: null }

    } catch (error: any) {
      console.error("💥 Sign up error:", error)
      return { user: null, error: error.message || "An unexpected error occurred" }
    }
  }

  const signIn = async (email: string, password: string): Promise<{ user: User | null; error: string | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { user: null, error: error.message }
      }

      if (data.user) {
        setUser(data.user)
      }

      return { user: data.user, error: null }
    } catch (error: any) {
      console.error("Sign in error:", error)
      return { user: null, error: error.message || "An unexpected error occurred" }
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  }

  const refreshUser = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error("Error refreshing user:", error)
        setUser(null)
        return
      }

      setUser(session?.user ?? null)
    } catch (error) {
      console.error("Error refreshing user:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}