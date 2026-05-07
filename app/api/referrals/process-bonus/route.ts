import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { processReferralBonusForMachine } from "@/lib/payment-fulfillment"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, machineId } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 })
    }

    let targetMachineId = machineId

    if (!targetMachineId) {
      const { data: latestMachine, error } = await supabase
        .from("user_machines")
        .select("machine_type_id")
        .eq("user_id", userId)
        .order("purchased_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error || !latestMachine) {
        return NextResponse.json({ success: false, error: "Machine not found" }, { status: 404 })
      }

      targetMachineId = latestMachine.machine_type_id
    }

    const result = await processReferralBonusForMachine(supabase, userId, targetMachineId.toString())

    return NextResponse.json({
      success: true,
      bonusPaid: result.paid,
      message: result.message
    })
  } catch (error: any) {
    console.error("Referral bonus processing error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Referral bonus API is active"
  })
}
