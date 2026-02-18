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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white w-[90%] max-w-md p-6 rounded-2xl shadow-2xl animate-scaleIn text-center">
        <div className="text-4xl mb-3">{getIcon()}</div>
        <h2 className="text-xl font-bold mb-3">{title}</h2>
        <p className="text-gray-600 mb-4">{message}</p>

        {showButton && (
          <button
            onClick={handleButtonClick}
            className={`${getButtonColor()} text-white px-5 py-2 rounded-lg mb-3 transition w-full font-bold`}
          >
            {buttonText || (type === "referral" ? "Participate Now" : 
             type === "announcement" ? "Go to Wallet" : 
             "Withdraw Now")}
          </button>
        )}

        <button
          onClick={() => setOpen(false)}
          className="text-red-500 font-semibold hover:text-red-700 transition"
        >
          Close
        </button>
      </div>
    </div>
  )
}