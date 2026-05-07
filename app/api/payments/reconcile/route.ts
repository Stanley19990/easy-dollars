import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { ensureFapshiTransaction, extractFapshiStatus, normalizeFapshiStatus } from "@/lib/fapshi-payments"
import { fulfillMachinePurchase } from "@/lib/payment-fulfillment"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const FAPSHI_BASE_URL = process.env.FAPSHI_BASE_URL || process.env.FAPSHI_ENVIRONMENT || "https://live.fapshi.com"

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

    console.log("📥 Fapshi status response:", {
      transId,
      ok: response.ok,
      statusCode: response.status,
      status: extractFapshiStatus(responseData),
      message: responseData?.message || responseData?.data?.message || null,
      reason: responseData?.reason || responseData?.data?.reason || responseData?.data?.failureReason || null,
      medium: responseData?.medium || responseData?.data?.medium || null
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: responseData?.message || "Failed to check status" },
        { status: 502 }
      )
    }

    const normalizedStatus = normalizeFapshiStatus(extractFapshiStatus(responseData))

    let { data: transaction } = await supabase
      .from("transactions")
      .select("id, user_id, external_id, metadata, created_at")
      .eq("fapshi_trans_id", transId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!transaction) {
      transaction = await ensureFapshiTransaction(supabase, responseData)
    }

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

    let fulfillment = null
    if (normalizedStatus === "successful") {
      fulfillment = await fulfillMachinePurchase(supabase, transaction)
    }

    return NextResponse.json({
      success: true,
      status: normalizedStatus,
      recovered: Boolean((transaction as any)?.metadata?.recovered_from_fapshi),
      fulfillment
    })
  } catch (error: any) {
    console.error("❌ Reconcile error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
