import { supabase } from './supabase'

export interface CreateNotificationParams {
  userId: string
  title: string
  message: string
  type: 'payment' | 'earning' | 'referral' | 'system' | 'warning'
  relatedId?: string
  metadata?: any
}

export class NotificationService {
  static async createNotification(params: CreateNotificationParams) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: params.userId,
          title: params.title,
          message: params.message,
          type: params.type,
          related_id: params.relatedId,
          metadata: params.metadata,
          is_read: false
        })

      if (error) {
        console.error('Error creating notification:', error)
        return false
      }

      console.log('✅ Notification created:', params.title)
      return true
    } catch (error) {
      console.error('Error creating notification:', error)
      return false
    }
  }

  // Pre-defined notification templates
  static async notifyPaymentSuccess(userId: string, amount: number, machineName: string) {
    return this.createNotification({
      userId,
      title: 'Payment Successful!',
      message: `Your payment of ${amount.toLocaleString()} XAF for ${machineName} was successful.`,
      type: 'payment',
      metadata: { amount, machineName }
    })
  }

  static async notifyEarningClaimed(userId: string, amount: number, machineName: string) {
    return this.createNotification({
      userId,
      title: 'Earnings Claimed!',
      message: `You successfully claimed ${amount} ED from ${machineName}.`,
      type: 'earning',
      metadata: { amount, machineName }
    })
  }

  static async notifyReferralBonus(userId: string, referredUser: string, bonusAmount: number) {
    return this.createNotification({
      userId,
      title: 'Referral Bonus!',
      message: `You earned $${bonusAmount} from ${referredUser}'s purchase.`,
      type: 'referral',
      metadata: { referredUser, bonusAmount }
    })
  }

  static async notifyMachineActivated(userId: string, machineName: string) {
    return this.createNotification({
      userId,
      title: 'Machine Activated!',
      message: `Your ${machineName} is now mining and earning rewards.`,
      type: 'earning',
      metadata: { machineName }
    })
  }

  static async notifyConversionComplete(userId: string, edAmount: number, usdAmount: number) {
    return this.createNotification({
      userId,
      title: 'Conversion Complete!',
      message: `You converted ${edAmount} ED to $${usdAmount.toFixed(2)} USD.`,
      type: 'payment',
      metadata: { edAmount, usdAmount }
    })
  }

  static async notifyLowBalance(userId: string) {
    return this.createNotification({
      userId,
      title: 'Low Balance',
      message: 'Your ED balance is getting low. Consider converting or purchasing more machines.',
      type: 'warning'
    })
  }
}