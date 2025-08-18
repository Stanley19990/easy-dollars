"use client"

import { useEffect, useState } from "react"

export function FloatingParticles() {
  const [particles, setParticles] = useState<Array<{ id: number; delay: number; left: number }>>([])

  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      delay: Math.random() * 8,
      left: Math.random() * 100,
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-cyan-400 rounded-full floating-particle opacity-30"
          style={{
            left: `${particle.left}%`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
