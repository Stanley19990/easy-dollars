import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const FAPSHI_BASE_URL = process.env.FAPSHI_BASE_URL || "https://live.fapshi.com"

const normalizeStatus = (status: string | null | undefined) => {
  if (!status) return "unknown"
  const normalized = status.toLowerCase()
  if (["successful", "success", "completed", "complete"].includes(normalized)) return "successful"
  if (["failed", "fail", "canceled", "cancelled"].includes(normalized)) return "failed"
  if (["pending", "processing", "in_progress"].includes(normalized)) return "pending"
  return normalized
}

const extractMachineId = (transaction: any) => {
  return (
    transaction?.metadata?.machineId ||
    transaction?.metadata?.machine_id ||
    transaction?.metadata?.machine_type_id ||
    (typeof transaction?.external_id === "string"
      ? transaction.external_id.split("_")[1]
      : null)
  )
}

async function activateMachineFromTransaction(transaction: any) {
  const userId = transaction.user_id
  const machineId = extractMachineId(transaction)

  if (!userId || !machineId) return

  const { data: existing } = await supabase
    .from("user_machines")
    .select("id")
    .eq("user_id", userId)
    .eq("machine_type_id", parseInt(machineId))
    .maybeSingle()

  if (existing) return

  await supabase.from("user_machines").insert({
    user_id: userId,
    machine_type_id: parseInt(machineId),
    purchased_at: transaction.created_at || new Date().toISOString(),
    is_active: true,
    activated_at: new Date().toISOString(),
    last_claim_time: new Date().toISOString()
  })

  const { count } = await supabase
    .from("user_machines")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  await supabase
    .from("users")
    .update({ machines_owned: count || 0 })
    .eq("id", userId)
}

export async function POST(request: NextRequest) {
  try {
    const { transId } = await request.json()

    if (!transId) {
      return NextResponse.json({ success: false, error: "Missing transId" }, { status: 400 })
    }

    const response = await fetch(`${FAPSHI_BASE_URL}/payment-status/${transId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        apiuser: process.env.FAPSHI_API_USER!,
        apikey: process.env.FAPSHI_API_KEY!
      }
    })

    const responseData = await response.json().catch(() => null)

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: responseData?.message || "Failed to check status" },
        { status: 502 }
      )
    }

    const status =
      responseData?.status ||
      responseData?.data?.status ||
      (Array.isArray(responseData) ? responseData?.[0]?.status : null)

    const normalizedStatus = normalizeStatus(status)

    const { data: transaction } = await supabase
      .from("transactions")
      .select("id, user_id, external_id, metadata, created_at")
      .eq("fapshi_trans_id", transId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!transaction) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 })
    }

    await supabase
      .from("transactions")
      .update({
        status: normalizedStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", transaction.id)

    if (normalizedStatus === "successful") {
      await activateMachineFromTransaction(transaction)
    }

    return NextResponse.json({
      success: true,
      status: normalizedStatus
    })
  } catch (error: any) {
    console.error("❌ Reconcile error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
