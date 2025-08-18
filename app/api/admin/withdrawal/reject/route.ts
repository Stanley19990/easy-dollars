import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminAuth } from "@/lib/auth-admin"

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request)
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const body = await request.json()
    const { withdrawalId, rejectionReason } = body

    console.log("Admin withdrawal rejection request:", {
      withdrawalId,
      rejectionReason,
      rejectedBy: authResult.user?.email,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: "Withdrawal rejected successfully",
      withdrawalId,
      rejectedBy: authResult.user?.email,
      rejectedAt: new Date().toISOString(),
      reason: rejectionReason,
    })
  } catch (error) {
    console.error("Withdrawal rejection error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
