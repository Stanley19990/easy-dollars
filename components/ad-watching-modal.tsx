"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Pause, CheckCircle, XCircle, Coins, Clock } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { authService } from "@/lib/auth"

// Define AdReward interface with all required properties
export interface AdReward {
  amount: number;
  currency: string;
  machineId: string;
  sessionId: string;
}

interface AdWatchingModalProps {
  isOpen: boolean
  onClose: () => void
  machineId: string
  machineName: string
  rewardAmount: number
  onRewardEarned: (reward: AdReward) => void
}

export function AdWatchingModal({ isOpen, onClose, machineId, machineName, rewardAmount, onRewardEarned }: AdWatchingModalProps) {
  const { user } = useAuth()
  const [adState, setAdState] = useState<"loading" | "playing" | "completed" | "failed">("loading")
  const [progress, setProgress] = useState(0)
  const [countdown, setCountdown] = useState(3)
  const [reward, setReward] = useState<AdReward | null>(null)

  // Start countdown when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setAdState("loading")
      setProgress(0)
      setCountdown(3)
      setReward(null)
    }
  }, [isOpen, user])

  // Countdown timer
  useEffect(() => {
    if (adState === "loading" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && adState === "loading") {
      playAd()
    }
  }, [countdown, adState])

  // Simulate progress bar
  useEffect(() => {
    if (adState === "playing") {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 100 / 30 // 30 seconds total
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [adState])

  // Play ad (call backend)
  const playAd = async () => {
    if (!user) return
    setAdState("playing")

    try {
      const result = await authService.watchAd(user.id, machineId, rewardAmount)

      if (result.success) {
        const earnedReward: AdReward = { 
          amount: rewardAmount,
          currency: "ED",
          machineId: machineId,
          sessionId: `session_${Date.now()}`
        }
        setReward(earnedReward)
        setAdState("completed")
        onRewardEarned(earnedReward)
      } else {
        console.error("Ad reward error:", result.error)
        setAdState("failed")
      }
    } catch (error) {
      console.error("Unexpected error in watchAd:", error)
      setAdState("failed")
    }
  }

  const handleClose = () => {
    setAdState("loading")
    setProgress(0)
    setCountdown(3)
    setReward(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-cyan-500/20">
        <DialogHeader>
          <DialogTitle className="text-center bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Watch Ad - {machineName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Loading */}
          {adState === "loading" && (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                    <Play className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Preparing Your Ad</h3>
                <p className="text-slate-400 mb-4">Get ready to earn Easy Dollars!</p>
                <div className="text-3xl font-bold text-cyan-400">{countdown}</div>
              </CardContent>
            </Card>
          )}

          {/* Playing */}
          {adState === "playing" && (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4">
                    <Pause className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Ad Playing</h3>
                  <p className="text-slate-400">Watch the full ad to earn your reward</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 text-sm text-slate-300">
                    <Clock className="h-4 w-4" />
                    <span>Estimated reward: {rewardAmount.toFixed(2)} ED</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completed */}
          {adState === "completed" && reward && (
            <Card className="bg-slate-800 border-green-500/20">
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-green-400">Congratulations!</h3>
                <p className="text-slate-400 mb-4">You've successfully earned your reward</p>

                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-center space-x-2 text-green-400">
                    <Coins className="h-5 w-5" />
                    <span className="text-xl font-bold">+{reward.amount.toFixed(2)} ED</span>
                  </div>
                </div>

                <Button onClick={handleClose} className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-500">
                  Collect Reward
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Failed */}
          {adState === "failed" && (
            <Card className="bg-slate-800 border-red-500/20">
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-red-400">Ad Failed</h3>
                <p className="text-slate-400 mb-4">Something went wrong</p>
                <div className="space-y-2">
                  <Button onClick={playAd} variant="outline" className="w-full bg-transparent">
                    Try Again
                  </Button>
                  <Button onClick={handleClose} variant="ghost" className="w-full">
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}