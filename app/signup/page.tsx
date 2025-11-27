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
    const urlParams = new URLSearchParams(window.location.search)
    const refCode = urlParams.get('ref')
    
    if (refCode) {
      setReferralCode(refCode)
      console.log('🎯 Referral code detected:', refCode)
    }
    
    const timer = setTimeout(() => {
      setShowModal(true)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  const handleCloseModal = () => {
    setShowModal(false)
    setTimeout(() => {
      router.push("/")
    }, 300)
  }

  const handleSuccess = () => {
    setShowModal(false)
    setTimeout(() => {
      router.push("/dashboard")
    }, 1000)
  }

  const handleLoginRedirect = () => {
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-3 sm:p-4">
      {!showModal && (
        <div className="text-center">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-500 animate-spin mx-auto mb-3 sm:mb-4" />
          <p className="text-slate-400 text-sm sm:text-base">Loading signup form...</p>
        </div>
      )}
      
      <SignupModal 
        open={showModal}
        onOpenChange={handleCloseModal}
        initialReferralCode={referralCode}
        onSuccess={handleSuccess}
      />

      {showModal && (
        <div className="mt-4 sm:mt-6 text-center space-y-2 sm:space-y-3 px-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-px w-12 sm:w-16 bg-slate-700"></div>
            <p className="text-slate-400 text-xs sm:text-sm whitespace-nowrap">Already have an account?</p>
            <div className="h-px w-12 sm:w-16 bg-slate-700"></div>
          </div>
          
          <Button
            onClick={handleLoginRedirect}
            variant="outline"
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 hover:border-cyan-500/50 transition-all text-sm sm:text-base h-9 sm:h-10 px-4 sm:px-6"
          >
            <LogIn className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            Login Here
          </Button>
        </div>
      )}
    </div>
  )
}