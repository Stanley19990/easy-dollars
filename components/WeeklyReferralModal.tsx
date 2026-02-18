"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function WeeklyReferralModal() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user has seen this modal in this session
    const seen = sessionStorage.getItem("weeklyReferralSeen")
    if (!seen) {
      // Show after 2 seconds
      const timer = setTimeout(() => {
        setOpen(true)
        sessionStorage.setItem("weeklyReferralSeen", "true")
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white w-[90%] max-w-md p-6 rounded-2xl shadow-2xl animate-scaleIn text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-3 text-gray-800">
          Weekly Referral Contest!
        </h2>
        
        <div className="space-y-4 mb-6">
          <p className="text-gray-600">
            Invite your friends and win big every week:
          </p>
          
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl">
            <div className="space-y-2">
              <div className="flex justify-between items-center font-bold">
                <span className="text-gray-700">🥇 1st Prize:</span>
                <span className="text-2xl text-green-600">500,000 XAF</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">🥈 2nd Prize:</span>
                <span className="text-xl text-blue-600">300,000 XAF</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">🥉 3rd Prize:</span>
                <span className="text-xl text-purple-600">200,000 XAF</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">4th Prize:</span>
                <span className="text-lg text-indigo-600">100,000 XAF</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">5th Prize:</span>
                <span className="text-lg text-pink-600">50,000 XAF</span>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-500">
            Contest resets every Monday at 00:00 GMT
          </p>
        </div>

        <button
          onClick={() => {
            setOpen(false)
            router.push("/referrals")
          }}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-lg mb-3 transition hover:scale-105 font-bold text-lg"
        >
          Participate Now 🚀
        </button>

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