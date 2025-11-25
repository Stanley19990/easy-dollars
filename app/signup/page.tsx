// app/signup/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SignupModal } from "@/components/signup-modal"
import { Loader2, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SignupPage() {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [referralCode, setReferralCode] = useState("")

  useEffect(() => {
    // Get referral code from URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const refCode = urlParams.get('ref')
    
    if (refCode) {
      setReferralCode(refCode)
      console.log('🎯 Referral code detected:', refCode)
    }
    
    // Show the modal after a brief delay for better UX
    const timer = setTimeout(() => {
      setShowModal(true)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  const handleCloseModal = () => {
    setShowModal(false)
    // Redirect to home page after modal closes
    setTimeout(() => {
      router.push("/")
    }, 300)
  }

  const handleSuccess = () => {
    setShowModal(false)
    // Redirect to dashboard after successful signup
    setTimeout(() => {
      router.push("/dashboard")
    }, 1000)
  }

  const handleLoginRedirect = () => {
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {/* Loading state */}
      {!showModal && (
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading signup form...</p>
        </div>
      )}
      
      {/* Signup Modal */}
      <SignupModal 
        open={showModal}
        onOpenChange={handleCloseModal}
        initialReferralCode={referralCode}
        onSuccess={handleSuccess}
      />

      {/* ✅ NEW: Login redirect button for existing users */}
      {showModal && (
        <div className="mt-6 text-center space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-px w-16 bg-slate-700"></div>
            <p className="text-slate-400 text-sm">Already have an account?</p>
            <div className="h-px w-16 bg-slate-700"></div>
          </div>
          
          <Button
            onClick={handleLoginRedirect}
            variant="outline"
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 hover:border-cyan-500/50 transition-all"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Login Here
          </Button>
        </div>
      )}
    </div>
  )
}