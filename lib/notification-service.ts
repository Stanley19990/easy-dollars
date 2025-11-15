// lib/notification-service.ts
import { createClient } from '@supabase/supabase-js'

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseKey)
}

const supabase = getSupabaseClient()

export class NotificationService {
  static markAsRead(notificationId: string) {
    throw new Error("Method not implemented.")
  }
  static async createNotification(notification: any) {
    if (!supabase) {
      console.warn('Supabase not available - notification skipped')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([notification])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating notification:', error)
      return null
    }
  }

  static async getUserNotifications(userId: string) {
    if (!supabase) {
      console.warn('Supabase not available - returning empty notifications')
      return []
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
  }

  static async getUnreadCount(userId: string) {
    if (!supabase) {
      return 0
    }

    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }
}