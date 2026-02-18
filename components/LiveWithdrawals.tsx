"use client"

import { useEffect, useState } from "react"

interface Withdrawal {
  id: string
  amount: number
  created_at: string
  user: {
    username: string
  }
}

export default function LiveWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    // Demo users only - no database calls
    const demoUsers = [
      "John_Doe", "Marie_Claire", "Paul_Biya", "Alice_Ndop", "Marc_Kouam",
      "Sophie_Tchuente", "Jean_Nganou", "Laura_Fotso", "Eric_Djomo", "Rachel_Tagne",
      "Steve_Wandji", "Doris_Kenfack", "Herve_Tchamba", "Nicole_Ndam", "Frank_Mballa",
      "Yvette_Atangana", "Cyrille_Meyo", "Patricia_Etoga", "Gael_Nana", "Brigitte_Tamo",
      "Armel_Simo", "Christelle_Njike", "Landry_Mekongo", "Vanessa_Beyala", "Serge_Nono",
      "Muriel_Kamga", "Olivier_Tsala", "Estelle_Ngono", "Brice_Mbarga", "Carine_Ndongo"
    ]
    
    const amounts = [25000, 35000, 45000, 55000, 65000, 75000, 85000, 95000, 125000, 150000]
    
    const demoWithdrawals: Withdrawal[] = []
    
    for (let i = 0; i < 30; i++) {
      const randomUser = demoUsers[Math.floor(Math.random() * demoUsers.length)]
      const randomAmount = amounts[Math.floor(Math.random() * amounts.length)]
      const randomMinutesAgo = Math.floor(Math.random() * 120)
      
      const date = new Date()
      date.setMinutes(date.getMinutes() - randomMinutesAgo)
      
      demoWithdrawals.push({
        id: `demo_${i}`,
        amount: randomAmount,
        created_at: date.toISOString(),
        user: {
          username: randomUser
        }
      })
    }
    
    setWithdrawals(demoWithdrawals.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ))

    // Rotate every 4 seconds
    const interval = setInterval(() => {
      setCurrentIndex(prev => 
        prev < demoWithdrawals.length - 1 ? prev + 1 : 0
      )
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  if (withdrawals.length === 0) return null

  const current = withdrawals[currentIndex]

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg animate-slideIn">
      <div className="flex items-center space-x-2">
        <span className="text-xl">💸</span>
        <div className="flex flex-col">
          <span className="text-sm font-bold">
            {current.user?.username || "A user"} just withdrew
          </span>
          <span className="text-lg font-black">
            {current.amount.toLocaleString()} XAF
          </span>
        </div>
      </div>
    </div>
  )
}