"use client"

import { useEffect, useState } from "react"

interface MoneyMachineProps {
  className?: string
  delay?: number
}

export function MoneyMachine({ className = "", delay = 0 }: MoneyMachineProps) {
  const [cashFlow, setCashFlow] = useState(false)

  useEffect(() => {
    const interval = setInterval(
      () => {
        setCashFlow(true)
        setTimeout(() => setCashFlow(false), 1000)
      },
      3000 + delay * 1000,
    )

    return () => clearInterval(interval)
  }, [delay])

  return (
    <div className={`relative ${className}`} style={{ animationDelay: `${delay}s` }}>
      {/* 3D Machine Body */}
      <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg neon-border relative">
        {/* Machine Screen */}
        <div className="absolute inset-2 bg-cyan-400 rounded opacity-80 flex items-center justify-center">
          <div className="text-xs font-bold text-slate-900">AD</div>
        </div>

        {/* Cash Flow Animation */}
        {cashFlow && (
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-1 bg-amber-400 rounded animate-bounce"
                style={{
                  left: `${i * 4 - 4}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: "1s",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
