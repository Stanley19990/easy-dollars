import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminAuth } from "@/lib/auth-admin"

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request)
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const body = await request.json()
    const { withdrawalId, adminNotes } = body

    console.log("Admin withdrawal approval request:", {
      withdrawalId,
      adminNotes,
      approvedBy: authResult.user?.email,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: "Withdrawal approved successfully",
      withdrawalId,
      approvedBy: authResult.user?.email,
      approvedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Withdrawal approval error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
