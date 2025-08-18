"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
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
    referralCode?: string,
  ) => Promise<{ user: User | null; error?: string }>
  signIn: (email: string, password: string) => Promise<{ user: User | null; error?: string }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
      setLoading(false)
    }
    loadUser()
  }, [])

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    country: string,
    phone?: string,
    referralCode?: string,
  ) => {
    const result = await authService.signUp(email, password, fullName, country, phone, referralCode)
    if (result.user) {
      setUser(result.user)
    }
    return result
  }

  const signIn = async (email: string, password: string) => {
    const result = await authService.signIn(email, password)
    if (result.user) {
      setUser(result.user)
    }
    return result
  }

  const signOut = async () => {
    await authService.signOut()
    setUser(null)
  }

  const refreshUser = async () => {
    const currentUser = await authService.getCurrentUser()
    setUser(currentUser)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
