"use client"

import { Card } from "@/components/ui/card"
import { useState } from "react"

const steps = [
  {
    title: "AI Account Setup",
    description: "Create your AI-powered earning profile with smart wallet integration",
    icon: "🤖",
    animation: "AI avatar materializes with holographic data streams",
    aiFeature: "Personalized earning algorithms",
  },
  {
    title: "Smart Machine Selection",
    description: "AI recommends optimal ad-watching machines based on your profile",
    icon: "🏭",
    animation: "Holographic machine catalog with AI recommendations",
    aiFeature: "Machine performance prediction",
  },
  {
    title: "Targeted Ad Experience",
    description: "Watch AI-curated ads that match your interests and maximize earnings",
    icon: "📺",
    animation: "Immersive ad display with earning particles",
    aiFeature: "Real-time earning optimization",
  },
  {
    title: "Automated Payouts",
    description: "AI processes your earnings and handles secure withdrawals",
    icon: "💎",
    animation: "Digital currency flows with blockchain verification",
    aiFeature: "Smart payout scheduling",
  },
]

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState<number | null>(null)

  return (
    <section id="how-it-works" className="py-20 px-4 relative z-10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-cyan-400 text-sm font-mono tracking-wider">AI-POWERED PROCESS</span>
          <h2 className="text-4xl md:text-6xl font-bold mt-4 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            How AI Maximizes Your Earnings
          </h2>
          <p className="text-slate-300 text-lg mt-4 max-w-2xl mx-auto">
            Our advanced artificial intelligence handles everything automatically, so you can focus on earning while AI
            does the heavy lifting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <Card
              key={index}
              className="bg-slate-800/30 backdrop-blur-sm border border-cyan-400/20 p-6 text-center cursor-pointer transition-all duration-300 hover:scale-105 hover:border-cyan-400/50 hover:bg-slate-700/40"
              onClick={() => setActiveStep(activeStep === index ? null : index)}
            >
              <div className="relative">
                <div className="text-5xl mb-4 filter drop-shadow-lg">{step.icon}</div>
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-cyan-400 rounded-full animate-pulse"></div>
              </div>

              <h3 className="text-xl font-bold mb-2 text-cyan-300">{step.title}</h3>
              <p className="text-slate-300 mb-4 leading-relaxed">{step.description}</p>

              <div className="text-xs text-cyan-400 font-mono mb-4">{step.aiFeature}</div>

              {activeStep === index && (
                <div className="mt-4 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-400/30 backdrop-blur-sm">
                  <p className="text-sm text-amber-300 italic mb-2">{step.animation}</p>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full animate-pulse"
                      style={{ width: "75%" }}
                    ></div>
                  </div>
                  <p className="text-xs text-cyan-300 mt-2">AI Processing Active</p>
                </div>
              )}
            </Card>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-slate-800/20 backdrop-blur-sm rounded-lg border border-cyan-400/20">
            <div className="text-3xl font-bold text-cyan-400">2.4M+</div>
            <div className="text-slate-300">AI Calculations Daily</div>
          </div>
          <div className="text-center p-6 bg-slate-800/20 backdrop-blur-sm rounded-lg border border-cyan-400/20">
            <div className="text-3xl font-bold text-green-400">97.3%</div>
            <div className="text-slate-300">AI Accuracy Rate</div>
          </div>
          <div className="text-center p-6 bg-slate-800/20 backdrop-blur-sm rounded-lg border border-cyan-400/20">
            <div className="text-3xl font-bold text-amber-400">$847K</div>
            <div className="text-slate-300">AI-Generated Earnings</div>
          </div>
        </div>
      </div>
    </section>
  )
}
