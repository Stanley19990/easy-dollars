// AdMob Integration Service
export interface AdReward {
  amount: number
  currency: "USD" | "ED"
  machineId: string
  sessionId: string
}

export interface AdSession {
  id: string
  userId: string
  machineId: string
  adUnitId: string
  startTime: Date
  endTime?: Date
  completed: boolean
  reward?: AdReward
}

class AdMobService {
  private sessions: Map<string, AdSession> = new Map()

  // Initialize AdMob SDK (placeholder)
  async initialize(): Promise<boolean> {
    console.log("[INFO] AdMob SDK initialized")
    return true
  }

  // Create a new ad session
  createAdSession(userId: string, machineId: string): AdSession {
    const sessionId = Math.random().toString(36).substr(2, 9)
    const session: AdSession = {
      id: sessionId,
      userId,
      machineId,
      adUnitId: "ca-app-pub-3940256099942544/5224354917", // Test ad unit ID
      startTime: new Date(),
      completed: false,
    }

    this.sessions.set(sessionId, session)
    return session
  }

  // Load and show rewarded ad
  async showRewardedAd(sessionId: string): Promise<{ success: boolean; reward?: AdReward; error?: string }> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return { success: false, error: "Session not found" }
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.1 // 90% chance of success

        if (success) {
          const rewardAmount = this.calculateReward(session.machineId)
          const reward: AdReward = {
            amount: rewardAmount,
            currency: "ED",
            machineId: session.machineId,
            sessionId: session.id,
          }

          session.completed = true
          session.endTime = new Date()
          session.reward = reward

          resolve({ success: true, reward })
        } else {
          resolve({ success: false, error: "Ad failed to load or was skipped" })
        }
      }, 3000) // Simulate 3-second ad
    })
  }

  // Public reward calculation method
  public calculateReward(machineId: string): number {
    const baseRewards: Record<string, number> = {
      "1": 0.05, // Basic Miner
      "2": 0.08, // Power Miner
      "3": 0.12, // Turbo Miner
      "4": 0.18, // Quantum Miner
      "5": 0.25, // Mega Miner
    }
    return baseRewards[machineId] || 0.05
  }

  // Get session details
  getSession(sessionId: string): AdSession | undefined {
    return this.sessions.get(sessionId)
  }

  // Check if user can watch more ads today
  canWatchAd(userId: string, machineId: string): boolean {
    const today = new Date().toDateString()
    const todaySessions = Array.from(this.sessions.values()).filter(
      (session) =>
        session.userId === userId &&
        session.machineId === machineId &&
        session.startTime.toDateString() === today &&
        session.completed
    )

    return todaySessions.length < 10
  }

  // Get today's ad count for a machine
  getTodayAdCount(userId: string, machineId: string): number {
    const today = new Date().toDateString()
    return Array.from(this.sessions.values()).filter(
      (session) =>
        session.userId === userId &&
        session.machineId === machineId &&
        session.startTime.toDateString() === today &&
        session.completed
    ).length
  }
}

export const adMobService = new AdMobService()
