import webpush from "web-push"
import type { SupabaseClient } from "@supabase/supabase-js"

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const privateKey = process.env.VAPID_PRIVATE_KEY
const subject = process.env.VAPID_SUBJECT || "mailto:support@cashrise.app"

let configured = false

export function configureWebPush() {
  if (configured) return Boolean(publicKey && privateKey)
  configured = true

  if (!publicKey || !privateKey) {
    console.warn("Web Push disabled: missing VAPID keys")
    return false
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
  return true
}

export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: {
    title: string
    message: string
    action_url?: string
  }
) {
  if (!configureWebPush()) {
    return { sent: 0, skipped: true }
  }

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId)

  if (error || !subscriptions?.length) {
    return { sent: 0, skipped: true }
  }

  let sent = 0

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        },
        JSON.stringify(payload)
      )
      sent++
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", subscription.id)
      } else {
        console.error("Push send failed:", error)
      }
    }
  }

  return { sent, skipped: false }
}

export async function createNotificationAndPush(
  supabase: SupabaseClient,
  notification: {
    user_id: string
    title: string
    message: string
    type: string
    action_url?: string
    related_id?: string
    metadata?: Record<string, any>
  }
) {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      ...notification,
      is_read: false
    })
    .select()
    .single()

  if (error) {
    console.error("Notification insert failed:", error)
  }

  await sendPushToUser(supabase, notification.user_id, {
    title: notification.title,
    message: notification.message,
    action_url: notification.action_url
  })

  return data
}
