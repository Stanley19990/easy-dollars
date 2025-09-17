"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { authService, type User } from "@/lib/auth"

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
  ) => Promise<{ user: User | null; error?: string }>
  signIn: (email: string, password: string) => Promise<{ user: User | null; error?: string }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user on app start
  const loadUser = useCallback(async () => {
    setLoading(true)
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error("Error loading user:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  // Sign up new user
  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    country: string,
    phone?: string,
    referralCode?: string
  ): Promise<{ user: User | null; error?: string }> => {
    const result = await authService.signUp(email, password, fullName, country, phone, referralCode)
    if (result.user) setUser(result.user)
    return result
  }

  // Sign in existing user
  const signIn = async (email: string, password: string): Promise<{ user: User | null; error?: string }> => {
    const result = await authService.signIn(email, password)
    if (result.user) setUser(result.user)
    return result
  }

  // Sign out user
  const signOut = async (): Promise<void> => {
    try {
      await authService.signOut()
      setUser(null)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // Refresh user data from backend
  const refreshUser = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error("Error refreshing user:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook for components to access auth
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
