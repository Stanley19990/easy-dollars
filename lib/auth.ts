import { supabase, type User, type MachineType, type UserMachine } from "./supabase"

// Export User type for other components to use
export type { User, MachineType, UserMachine }

// Admin emails with access to admin panel
const ADMIN_EMAILS = ["chiastanley3@gmail.com", "chiastanleymbeng3@gmail.com"]

export const authService = {
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("Testing database connection...")
      const { data, error } = await supabase.from("users").select("count").limit(1)

      if (error) {
        console.error("Database connection test failed:", error)
        return { success: false, error: error.message }
      }

      console.log("Database connection successful")
      return { success: true }
    } catch (error) {
      console.error("Database connection test error:", error)
      return { success: false, error: "Database connection failed" }
    }
  },

  async signUp(
  email: string,
  password: string,
  fullName: string,
  country: string,
  phone?: string,
  referralCode?: string,
): Promise<{ user: User | null; error?: string }> {
  try {
    console.log("Starting signup process for:", email)

    if (!email || !password || !fullName || !country) {
      console.error("Missing required fields:", {
        email: !!email,
        password: !!password,
        fullName: !!fullName,
        country: !!country,
      })
      return { user: null, error: "Please fill in all required fields including country" }
    }

    const connectionTest = await this.testConnection()
    if (!connectionTest.success) {
      return { user: null, error: `Database error: ${connectionTest.error}` }
    }

    // ✅ Check if phone is already used (only if provided)
    if (phone) {
      const { data: existingPhoneUser } = await supabase
        .from("users")
        .select("id")
        .eq("phone", phone)
        .maybeSingle()

      if (existingPhoneUser) {
        return { user: null, error: "Phone number already registered" }
      }
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    console.log("Supabase auth signup result:", { authData, authError })

    if (authError) {
      console.error("Auth signup error:", authError)
      return { user: null, error: authError.message }
    }

    if (!authData.user) {
      console.error("No user returned from auth signup")
      return { user: null, error: "Failed to create user" }
    }

    // Generate unique referral code
    const newReferralCode = Math.random().toString(36).substr(2, 8).toUpperCase()
    console.log("Generated referral code:", newReferralCode)

    // Find referrer if referral code provided
    let referrerId = null
    if (referralCode) {
      console.log("Looking up referral code:", referralCode)
      const { data: referrer } = await supabase
        .from("users")
        .select("id")
        .eq("referral_code", referralCode)
        .single()

      if (referrer) {
        referrerId = referrer.id
        console.log("Found referrer:", referrerId)
      } else {
        console.log("Referral code not found")
      }
    }

    console.log("Inserting user data into database...")
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        country,
        phone,
        referral_code: newReferralCode,
        referred_by: referrerId,
      })
      .select()
      .single()

    console.log("User insert result:", { userData, userError })

    if (userError) {
      console.error("User insert error:", userError)
      return { user: null, error: userError.message }
    }

    if (referrerId) {
      console.log("Adding referral bonus...")
      await this.addReferralBonus(referrerId, userData.id)
    }

    console.log("Signup completed successfully")
    return { user: userData, error: null }
  } catch (error) {
    console.error("Unexpected signup error:", error)
    return { user: null, error: "An unexpected error occurred" }
  }
},



  async signOut(): Promise<void> {
    await supabase.auth.signOut()
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) return null

      const { data: userData } = await supabase.from("users").select("*").eq("id", authUser.id).single()

      return userData || null
    } catch (error) {
      return null
    }
  },

  async getMachines(): Promise<MachineType[]> {
    try {
      const { data, error } = await supabase
        .from("machine_types")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true })

      if (error) {
        console.error("Error fetching machines:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error fetching machines:", error)
      return []
    }
  },

  async getUserMachines(userId: string): Promise<UserMachine[]> {
    try {
      const { data, error } = await supabase
        .from("user_machines")
        .select(`
          *,
          machine_types (*)
        `)
        .eq("user_id", userId)
        .eq("is_active", true)

      if (error) {
        console.error("Error fetching user machines:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error fetching user machines:", error)
      return []
    }
  },

  async purchaseMachine(userId: string, machineId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: machine } = await supabase.from("machine_types").select("*").eq("id", machineId).single()

      const { data: user } = await supabase
        .from("users")
        .select("wallet_balance, machines_owned")
        .eq("id", userId)
        .single()

      if (!machine || !user) {
        return { success: false, error: "Machine or user not found" }
      }

      if (user.wallet_balance < machine.price) {
        return { success: false, error: "Insufficient balance" }
      }

      const { error: purchaseError } = await supabase.from("user_machines").insert({
        user_id: userId,
        machine_type_id: machineId,
      })

      if (purchaseError) {
        return { success: false, error: purchaseError.message }
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({
          wallet_balance: user.wallet_balance - machine.price,
          machines_owned: user.machines_owned + 1,
        })
        .eq("id", userId)

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      await this.transferToAdminWallet(machine.price, `Machine purchase: ${machine.name}`)

      return { success: true }
    } catch (error) {
      return { success: false, error: "An unexpected error occurred" }
    }
  },

  async transferToAdminWallet(amount: number, description: string): Promise<void> {
    try {
      // Get or create admin wallet record
      const { data: adminWallet, error: fetchError } = await supabase.from("admin_wallet").select("*").single()

      if (fetchError && fetchError.code === "PGRST116") {
        // Admin wallet doesn't exist, create it
        await supabase.from("admin_wallet").insert({
          balance: amount,
          total_received: amount,
        })
      } else if (!fetchError && adminWallet) {
        // Update existing admin wallet
        await supabase
          .from("admin_wallet")
          .update({
            balance: adminWallet.balance + amount,
            total_received: adminWallet.total_received + amount,
          })
          .eq("id", adminWallet.id)
      }

      // Record the transaction
      await supabase.from("admin_transactions").insert({
        amount,
        transaction_type: "credit",
        description,
        status: "completed",
      })
    } catch (error) {
      console.error("Error transferring to admin wallet:", error)
    }
  },

  async getAdminWallet(): Promise<{ balance: number; totalReceived: number; totalWithdrawn: number }> {
    try {
      const { data: adminWallet } = await supabase.from("admin_wallet").select("*").single()

      if (!adminWallet) {
        return { balance: 0, totalReceived: 0, totalWithdrawn: 0 }
      }

      return {
        balance: adminWallet.balance,
        totalReceived: adminWallet.total_received,
        totalWithdrawn: adminWallet.total_withdrawn || 0,
      }
    } catch (error) {
      console.error("Error fetching admin wallet:", error)
      return { balance: 0, totalReceived: 0, totalWithdrawn: 0 }
    }
  },

  async adminWithdraw(amount: number, method: string, details: any): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: adminWallet } = await supabase.from("admin_wallet").select("*").single()

      if (!adminWallet || adminWallet.balance < amount) {
        return { success: false, error: "Insufficient admin wallet balance" }
      }

      // Update admin wallet balance
      await supabase
        .from("admin_wallet")
        .update({
          balance: adminWallet.balance - amount,
          total_withdrawn: (adminWallet.total_withdrawn || 0) + amount,
        })
        .eq("id", adminWallet.id)

      // Record the withdrawal transaction
      await supabase.from("admin_transactions").insert({
        amount: -amount,
        transaction_type: "withdrawal",
        description: `Admin withdrawal via ${method}`,
        status: "completed",
        withdrawal_method: method,
        withdrawal_details: details,
      })

      return { success: true }
    } catch (error) {
      console.error("Error processing admin withdrawal:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  },

  async getAdminTransactions(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("admin_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        console.error("Error fetching admin transactions:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error fetching admin transactions:", error)
      return []
    }
  },

  async addReferralBonus(referrerId: string, referredId: string): Promise<void> {
    try {
      await supabase.from("referrals").insert({
        referrer_id: referrerId,
        referred_id: referredId,
        bonus_amount: 5.0,
      })

      const { data: referrer } = await supabase.from("users").select("wallet_balance").eq("id", referrerId).single()

      if (referrer) {
        await supabase
          .from("users")
          .update({
            wallet_balance: referrer.wallet_balance + 5.0,
          })
          .eq("id", referrerId)

        await supabase.from("earnings").insert({
          user_id: referrerId,
          amount: 5.0,
          currency: "USD",
          earning_type: "referral",
          description: "Referral bonus for new user signup",
        })
      }
    } catch (error) {
      console.error("Error adding referral bonus:", error)
    }
  },

  isAdmin(email: string): boolean {
    return ADMIN_EMAILS.includes(email.toLowerCase())
  },

  async watchAd(
    userId: string,
    machineId: string,
    rewardAmount: number,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error: sessionError } = await supabase.from("ad_sessions").insert({
        user_id: userId,
        machine_id: machineId,
        reward_amount: rewardAmount,
        session_duration: 30,
        completed: true,
      })

      if (sessionError) {
        return { success: false, error: sessionError.message }
      }

      const { data: user } = await supabase.from("users").select("ed_balance, total_earned").eq("id", userId).single()

      if (user) {
        await supabase
          .from("users")
          .update({
            ed_balance: user.ed_balance + rewardAmount,
            total_earned: user.total_earned + rewardAmount,
          })
          .eq("id", userId)

        await supabase.from("earnings").insert({
          user_id: userId,
          machine_id: machineId,
          amount: rewardAmount,
          currency: "ED",
          earning_type: "ad_watch",
          description: "Reward for watching advertisement",
        })

        await supabase
          .from("user_machines")
          .update({
            ads_watched_today: supabase.sql`ads_watched_today + 1`,
            last_ad_watched: new Date().toISOString(),
            total_earned: supabase.sql`total_earned + ${rewardAmount}`,
          })
          .eq("id", machineId)
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: "An unexpected error occurred" }
    }
  },
}
