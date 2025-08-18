// AdMob Integration Service - Mock implementation for development
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

  // Mock AdMob initialization
  async initialize(): Promise<boolean> {
    // In real implementation, initialize Google AdMob SDK
    console.log("AdMob SDK initialized (mock)")
    return true
  }

  // Create new ad session
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

    // Mock ad loading and display
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate ad completion with 90% success rate
        const success = Math.random() > 0.1

        if (success) {
          // Calculate reward based on machine type
          const baseReward = this.calculateReward(session.machineId)
          const reward: AdReward = {
            amount: baseReward,
            currency: "ED",
            machineId: session.machineId,
            sessionId: sessionId,
          }

          // Update session
          session.completed = true
          session.endTime = new Date()
          session.reward = reward

          resolve({ success: true, reward })
        } else {
          resolve({ success: false, error: "Ad failed to load or was skipped" })
        }
      }, 3000) // Simulate 3-second ad duration
    })
  }

  // Calculate reward based on machine type
  private calculateReward(machineId: string): number {
    // Mock reward calculation - in real app, this would be based on actual AdMob revenue
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
    // Mock daily limit check - in real app, this would check database
    const today = new Date().toDateString()
    const todaySessions = Array.from(this.sessions.values()).filter(
      (session) =>
        session.userId === userId &&
        session.machineId === machineId &&
        session.startTime.toDateString() === today &&
        session.completed,
    )

    return todaySessions.length < 10 // Max 10 ads per machine per day
  }

  // Get today's ad count for a machine
  getTodayAdCount(userId: string, machineId: string): number {
    const today = new Date().toDateString()
    return Array.from(this.sessions.values()).filter(
      (session) =>
        session.userId === userId &&
        session.machineId === machineId &&
        session.startTime.toDateString() === today &&
        session.completed,
    ).length
  }
}

export const adMobService = new AdMobService()
