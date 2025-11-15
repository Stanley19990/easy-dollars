// app/signup/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SignupModal } from "@/components/signup-modal"
import { Loader2 } from "lucide-react"

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

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
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
    </div>
  )
}