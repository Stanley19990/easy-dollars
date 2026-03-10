import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const generateReferralCode = (fullName: string, userId: string): string => {
  const cleanName = fullName
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase()
    .substring(0, 8)

  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase()
  const userIdPart = userId.substring(0, 4)

  return `${cleanName}${randomStr}${userIdPart}`
}

const generateUsername = (fullName: string): string => {
  return (
    fullName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 20) + Math.random().toString(36).substring(2, 6)
  )
}

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      email,
      fullName,
      country,
      phone,
      referralCode,
      generatedReferralCode,
      generatedUsername
    } = await request.json()

    if (!userId || !fullName || !country) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
    if (authError || !authUser?.user) {
      return NextResponse.json(
        { success: false, error: "Auth user not found" },
        { status: 404 }
      )
    }

    const authEmail = authUser.user.email || email || null

    const { data: existingUser, error: existingError } = await supabase
      .from("users")
      .select("id, referral_code")
      .eq("id", userId)
      .maybeSingle()

    if (existingError) {
      return NextResponse.json(
        { success: false, error: "Failed to check existing profile" },
        { status: 500 }
      )
    }

    const referralCodeForUser =
      existingUser?.referral_code ||
      generatedReferralCode ||
      generateReferralCode(fullName, userId)

    const usernameForUser = generatedUsername || generateUsername(fullName)

    const userProfile: Record<string, any> = {
      id: userId,
      email: authEmail,
      username: usernameForUser,
      full_name: fullName,
      country,
      phone: phone || null,
      referral_code: referralCodeForUser
    }

    if (referralCode) {
      userProfile.referred_by = referralCode.trim()
    }

    const { error: upsertError } = await supabase
      .from("users")
      .upsert(userProfile, { onConflict: "id" })

    if (upsertError) {
      return NextResponse.json(
        { success: false, error: upsertError.message || "Failed to create user profile" },
        { status: 500 }
      )
    }

    if (referralCode) {
      const cleanReferralCode = referralCode.trim()

      const { data: referrer, error: referrerError } = await supabase
        .from("users")
        .select("id")
        .eq("referral_code", cleanReferralCode)
        .single()

      if (!referrerError && referrer?.id && referrer.id !== userId) {
        const { data: existingReferral } = await supabase
          .from("referrals")
          .select("id")
          .eq("referred_id", userId)
          .maybeSingle()

        if (!existingReferral) {
          await supabase.from("referrals").insert({
            referrer_id: referrer.id,
            referred_id: userId,
            referral_date: new Date().toISOString(),
            bonus: 0,
            status: "pending"
          })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("❌ Create profile error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
