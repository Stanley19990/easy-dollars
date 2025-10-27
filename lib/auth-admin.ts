import type { NextRequest } from "next/server"
import { supabaseAdmin } from "./supabaseAdmin"

// Load admin emails from environment variable with fallback
const ADMIN_EMAILS = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(",").map((email) => email.trim())
  : ["chiastanley3@gmail.com", "chiastanleymbeng3@gmail.com"]

export async function verifyAdminAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return { isValid: false, error: "Missing or invalid authorization header" }
    }

    const token = authHeader.split(" ")[1]

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      return { isValid: false, error: "Invalid token or user not found" }
    }

    if (!ADMIN_EMAILS.includes(user.email || "")) {
      return { isValid: false, error: "User is not authorized as admin" }
    }

    return { isValid: true, user }
  } catch (error) {
    console.error("Admin auth verification error:", error)
    return { isValid: false, error: "Authentication verification failed" }
  }
}
