"use client"

import { Button } from "@/components/ui/button"
import { MoneyMachine } from "@/components/money-machine"
import { useState } from "react"
import { SignupModal } from "@/components/signup-modal"
import { LoginModal } from "@/components/login-modal"

export function HeroSection() {
  const [showSignup, setShowSignup] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  const scrollToHowItWorks = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 z-10">
      {/* AI Character and Holographic Data Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-4 md:right-8 w-48 md:w-64 h-60 md:h-80 opacity-90 z-20">
          <img
            src="/placeholder.svg?height=320&width=256"
            alt="AI Assistant"
            className="w-full h-full object-contain animate-pulse drop-shadow-2xl"
          />
        </div>

        <div className="absolute top-20 left-4 md:left-20 bg-blue-500/10 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-3 md:p-4 animate-bounce z-10">
          <div className="text-cyan-300 text-xs md:text-sm font-mono">AI MARKET SCAN</div>
          <div className="text-green-400 font-bold text-sm md:text-base">+$247.83</div>
        </div>

        <div className="absolute bottom-32 right-4 md:right-32 bg-blue-500/10 backdrop-blur-sm border border-cyan-400/30 rounded-lg p-3 md:p-4 animate-pulse z-10">
          <div className="text-cyan-300 text-xs md:text-sm font-mono">LIVE EARNINGS</div>
          <div className="text-amber-400 font-bold text-sm md:text-base">$1,847.92</div>
        </div>

        {/* Floating 3D Money Machines */}
        <div className="absolute inset-0 pointer-events-none z-5">
          <MoneyMachine className="absolute top-20 left-10 money-machine" delay={0} />
          <MoneyMachine className="absolute top-40 right-20 money-machine" delay={2} />
          <MoneyMachine className="absolute bottom-40 left-20 money-machine" delay={4} />
          <MoneyMachine className="absolute bottom-20 right-10 money-machine" delay={1} />
        </div>
      </div>

      <div className="text-center max-w-5xl mx-auto">
        {/* Hero Content */}
        <div className="relative z-10">
          {/* Updated branding and messaging */}
          <div className="mb-4">
            <span className="text-cyan-400 text-sm font-mono tracking-wider">POWERED BY ADVANCED AI</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
            EASY DOLLARS
          </h1>

          <p className="text-2xl md:text-3xl mb-4 text-cyan-300 font-semibold">Your AI. Your Earnings. Your Future.</p>

          <p className="text-lg md:text-xl mb-8 text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Turn data into dollars with our{" "}
            <span className="text-cyan-400 font-semibold">next-generation AI platform</span>. Watch targeted ads, earn
            tokens, and let artificial intelligence
            <span className="text-amber-400 font-semibold"> maximize your earning potential</span>.
          </p>

          {/* AI Confidence Score */}
          <div className="mb-8 flex justify-center">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-cyan-400/30 rounded-full px-6 py-3">
              <span className="text-cyan-300 text-sm font-mono">AI CONFIDENCE SCORE: </span>
              <span className="text-green-400 font-bold text-lg">94.7%</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => setShowSignup(true)}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold px-10 py-4 text-lg rounded-full shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-105"
            >
              Start Earning Now
            </Button>
            <Button
              onClick={() => setShowLogin(true)}
              variant="outline"
              className="border-2 border-amber-400/50 text-amber-300 hover:bg-amber-500/10 hover:border-amber-400 px-10 py-4 text-lg bg-transparent rounded-full transition-all duration-300"
            >
              Login to Dashboard
            </Button>
            <Button
              onClick={scrollToHowItWorks}
              variant="outline"
              className="border-2 border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 px-10 py-4 text-lg bg-transparent rounded-full transition-all duration-300"
            >
              See AI in Action
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Real-time AI Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span>Secure Blockchain Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span>24/7 AI Monitoring</span>
            </div>
          </div>
        </div>
      </div>

      <SignupModal open={showSignup} onOpenChange={setShowSignup} />
      <LoginModal open={showLogin} onOpenChange={setShowLogin} />
    </section>
  )
}
