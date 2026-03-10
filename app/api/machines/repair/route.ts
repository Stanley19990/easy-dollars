import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 })
    }

    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("id, external_id, metadata")
      .eq("user_id", userId)
      .eq("type", "machine_purchase")
      .eq("status", "successful")

    if (txError) {
      return NextResponse.json({ success: false, error: "Failed to load transactions" }, { status: 500 })
    }

    let created = 0

    for (const tx of transactions || []) {
      const machineId =
        tx.metadata?.machine_id ??
        (typeof tx.external_id === "string" ? tx.external_id.split("_")[1] : null)

      if (!machineId) {
        continue
      }

      const { data: existing } = await supabase
        .from("user_machines")
        .select("id")
        .eq("user_id", userId)
        .eq("machine_type_id", parseInt(machineId))
        .single()

      if (existing) {
        continue
      }

      const { error: insertError } = await supabase
        .from("user_machines")
        .insert({
          user_id: userId,
          machine_type_id: parseInt(machineId),
          purchased_at: new Date().toISOString(),
          is_active: true,
          activated_at: new Date().toISOString(),
          last_claim_time: new Date().toISOString()
        })

      if (!insertError) {
        created += 1
      }
    }

    return NextResponse.json({ success: true, created })
  } catch (error: any) {
    console.error("❌ Repair machines error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
