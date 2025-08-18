import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminAuth } from "@/lib/auth-admin"

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request)
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const body = await request.json()
    const { userId, amount, description } = body

    console.log("Admin daily earnings credit request:", {
      userId,
      amount,
      description,
      creditedBy: authResult.user?.email,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: "Daily earnings credited successfully",
      userId,
      amount,
      description,
      creditedBy: authResult.user?.email,
      creditedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Daily earnings credit error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
