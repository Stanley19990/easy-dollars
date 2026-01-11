// app/auth/callback/page.tsx - FIXED VERSION
"use client"

import { Suspense, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

// Inner component that uses useSearchParams
function AuthCallbackContent() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash from the URL
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)
        
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const type = params.get('type')
        
        // Get query params from URL (not using useSearchParams)
        const urlParams = new URLSearchParams(window.location.search)
        const next = urlParams.get('next') || '/dashboard'

        if (accessToken && refreshToken) {
          // Set the session
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (error) throw error

          // If it's a recovery (password reset), go to update password
          if (type === 'recovery') {
            router.push('/update-password')
          } else {
            router.push(next)
          }
        } else {
          // Check existing session
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session) {
            router.push(next)
          } else {
            router.push('/login')
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        router.push('/login')
      }
    }

    // Small delay to ensure URL params are available
    setTimeout(() => {
      handleAuthCallback()
    }, 100)
  }, [router])

  return (
    <div className="text-center">
      <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mx-auto mb-4" />
      <p className="text-slate-400">Completing authentication...</p>
    </div>
  )
}

// Main component with Suspense boundary
export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center">
      <Suspense fallback={
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      }>
        <AuthCallbackContent />
      </Suspense>
    </div>
  )
}