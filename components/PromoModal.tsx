"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface PromoModalProps {
  title: string
  message: string
  showButton?: boolean
  buttonText?: string
  type?: "discount" | "withdrawal" | "referral" | "announcement"
}

export default function PromoModal({ 
  title, 
  message, 
  showButton = false,
  buttonText,
  type = "discount" 
}: PromoModalProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const seenKey = `popup_${type}_seen`
    const alreadySeen = sessionStorage.getItem(seenKey)
    
    if (type === "announcement") {
      const announcementKey = "popup_announcement_2024"
      const hasSeenAnnouncement = sessionStorage.getItem(announcementKey)
      
      if (!hasSeenAnnouncement) {
        const timer = setTimeout(() => {
          setOpen(true)
          sessionStorage.setItem(announcementKey, "true")
        }, 1000)
        return () => clearTimeout(timer)
      }
      return
    }
    
    if (!alreadySeen) {
      const timer = setTimeout(() => {
        setOpen(true)
        sessionStorage.setItem(seenKey, "true")
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [type])

  if (!open) return null

  const getIcon = () => {
    switch(type) {
      case "discount": return "🔥";
      case "withdrawal": return "💸";
      case "referral": return "🎉";
      case "announcement": return "📢";
      default: return "🔥";
    }
  }

  const getButtonColor = () => {
    switch(type) {
      case "discount": return "bg-green-600 hover:bg-green-700";
      case "withdrawal": return "bg-purple-600 hover:bg-purple-700";
      case "referral": return "bg-blue-600 hover:bg-blue-700";
      case "announcement": return "bg-amber-600 hover:bg-amber-700";
      default: return "bg-blue-600 hover:bg-blue-700";
    }
  }

  const handleButtonClick = () => {
    setOpen(false)
    if (type === "referral") {
      router.push("/referrals")
    } else if (type === "withdrawal" || type === "announcement") {
      const walletSection = document.getElementById('wallet-section')
      if (walletSection) {
        walletSection.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md cr-glass cr-card-3d rounded-3xl p-6 sm:p-7 text-center relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-44 w-44 rounded-full bg-cyan-500/20 blur-2xl" />
        <div className="absolute -bottom-24 -left-24 h-44 w-44 rounded-full bg-emerald-500/20 blur-2xl" />

        <div className="relative z-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/30 to-emerald-400/30 border border-cyan-400/30 shadow-[0_0_24px_rgba(55,199,255,0.3)]">
            <span className="text-2xl">{getIcon()}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{title}</h2>
          <p className="text-slate-300 mb-5 text-sm sm:text-base">{message}</p>

          {showButton && (
            <button
              onClick={handleButtonClick}
              className={`${getButtonColor()} text-white px-5 py-3 rounded-2xl mb-3 transition w-full font-bold shadow-lg hover:scale-[1.02]`}
            >
              {buttonText || (type === "referral" ? "Participate Now" : 
               type === "announcement" ? "Go to Wallet" : 
               "Withdraw Now")}
            </button>
          )}

          <button
            onClick={() => setOpen(false)}
            className="text-rose-300 font-semibold hover:text-rose-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
