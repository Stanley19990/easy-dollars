import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminAuth } from "@/lib/auth-admin"

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request)
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const body = await request.json()
    const { userId, walletBalance, edBalance, operation } = body

    console.log("Admin user balance update request:", {
      userId,
      walletBalance,
      edBalance,
      operation, // 'set', 'add', or 'subtract'
      updatedBy: authResult.user?.email,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: "User balance updated successfully",
      userId,
      newWalletBalance: walletBalance,
      newEdBalance: edBalance,
      updatedBy: authResult.user?.email,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("User balance update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
