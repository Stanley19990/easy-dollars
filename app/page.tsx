// app/page.tsx
"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, Suspense, useState } from "react"
import { HeroSection } from "@/components/hero-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { TransparencyWidget } from "@/components/transparency-widget"
import { CountrySelector } from "@/components/country-selector"
import { FloatingParticles } from "@/components/floating-particles"
import { LoginModal } from "@/components/login-modal"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

function LandingPageContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    // Check for password reset success parameter
    const resetSuccess = searchParams.get('resetSuccess')
    
    if (resetSuccess === 'true') {
      toast.success("Password reset successful! Please login with your new password.")
      setShowLoginModal(true)
      
      // Clean URL
      const url = new URL(window.location.href)
      url.searchParams.delete('resetSuccess')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <FloatingParticles />
      <HeroSection />
      <HowItWorksSection />
      <TransparencyWidget />
      <CountrySelector />
      <LoginModal 
        open={showLoginModal} 
        onOpenChange={setShowLoginModal} 
      />
    </main>
  )
}

export default function LandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    }>
      <LandingPageContent />
    </Suspense>
  )
}