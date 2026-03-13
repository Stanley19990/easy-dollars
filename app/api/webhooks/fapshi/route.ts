import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 🔒 SECURITY: Store processed webhook IDs to prevent replay attacks
const processedWebhooks = new Set<string>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const webhookData = JSON.parse(body)
    
    console.log('📩 Fapshi Webhook Received:', webhookData)

    // 🔒 SECURITY: Verify webhook signature if secret is configured
    if (process.env.FAPSHI_WEBHOOK_SECRET) {
      const signature = request.headers.get('x-fapshi-signature') || request.headers.get('signature')
      
      if (!signature) {
        console.error('❌ No signature provided in webhook')
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
      }

      const expectedSignature = crypto
        .createHmac('sha256', process.env.FAPSHI_WEBHOOK_SECRET)
        .update(body)
        .digest('hex')

      if (signature !== expectedSignature) {
        console.error('❌ Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
      
      console.log('✅ Webhook signature verified')
    } else {
      console.warn('⚠️ FAPSHI_WEBHOOK_SECRET not set - skipping signature verification')
    }

    const { transId, status, externalId } = webhookData

    // Validate required fields
    if (!transId || !status || !externalId) {
      console.error('❌ Missing required webhook fields')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 🔒 SECURITY: Prevent replay attacks
    if (processedWebhooks.has(transId)) {
      console.log('⚠️ Duplicate webhook detected, ignoring:', transId)
      return NextResponse.json({ received: true, duplicate: true })
    }
    processedWebhooks.add(transId)

    // Clean up old processed webhooks after 10 minutes
    setTimeout(() => processedWebhooks.delete(transId), 10 * 60 * 1000)

    const normalizedStatus = typeof status === "string" ? status.toLowerCase() : "unknown"
    const isSuccess = ["successful", "success", "completed", "complete"].includes(normalizedStatus)

    // Update transaction status in database
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ 
        status: isSuccess ? "successful" : normalizedStatus,
        updated_at: new Date().toISOString()
      })
      .eq('fapshi_trans_id', transId)

    if (updateError) {
      console.error('❌ Transaction update error:', updateError)
    }

    console.log('🔄 Payment Status Updated:', { transId, status: normalizedStatus })

    // ✅ Activate machine and process referral bonus if payment is successful
    if (isSuccess) {
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('user_id, external_id, metadata')
        .eq('fapshi_trans_id', transId)
        .single()

      if (txError || !transaction) {
        console.error('❌ Unable to load transaction for activation:', txError)
      } else {
        await activateUserMachine(transaction)
      }
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ✅ Activate machine using transaction metadata
async function activateUserMachine(transaction: any) {
  try {
    const { user_id, external_id, metadata } = transaction
    
    console.log('🔧 Activating machine for user:', user_id, 'metadata:', metadata)

    // Get machine ID from metadata
    const machineId = metadata?.machineId || metadata?.machine_id || metadata?.machine_type_id
    
    if (!machineId) {
      console.error('❌ No machine ID found in transaction metadata:', metadata)
      
      // Fallback: Try to extract from external_id if it contains machine ID
      const parts = external_id?.split('_') || []
      if (parts.length >= 2) {
        const possibleMachineId = parts[1]
        if (!isNaN(parseInt(possibleMachineId))) {
          console.log('⚠️ Using fallback machine ID extraction:', possibleMachineId)
          await processActivation(user_id, possibleMachineId, external_id)
          return
        }
      }
      return
    }

    await processActivation(user_id, machineId, external_id)

  } catch (error) {
    console.error('❌ Activation error:', error)
  }
}

// ✅ Process activation
async function processActivation(userId: string, machineId: string, externalId: string) {
  try {
    console.log('✅ Processing activation:', { userId, machineId })

    // Check if machine already activated
    const { data: existingMachine } = await supabase
      .from('user_machines')
      .select('id')
      .eq('user_id', userId)
      .eq('machine_type_id', parseInt(machineId))
      .maybeSingle()

    if (existingMachine) {
      console.log('⚠️ Machine already activated for user:', userId)
      
      // Still check referral in case it was missed
      await checkReferralBonus(userId, machineId)
      return
    }

    // Activate the machine
    const { data: userMachine, error } = await supabase
      .from('user_machines')
      .insert({
        user_id: userId,
        machine_type_id: parseInt(machineId),
        purchased_at: new Date().toISOString(),
        is_active: true,
        activated_at: new Date().toISOString(),
        last_claim_time: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Machine activation error:', error)
      return
    }

    console.log('✅ Machine activated successfully:', userMachine.id)

    // Update user's machines_owned count
    const { error: countError } = await supabase
      .from('users')
      .update({ 
        machines_owned: supabase.rpc('increment', { amount: 1 }) 
      })
      .eq('id', userId)

    if (countError) {
      // Fallback: Count and update
      const { count } = await supabase
        .from('user_machines')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
      
      await supabase
        .from('users')
        .update({ machines_owned: count || 0 })
        .eq('id', userId)
    }

    // Check referral bonus for this purchase
    await checkReferralBonus(userId, machineId)

  } catch (error) {
    console.error('❌ Process activation error:', error)
  }
}

// ✅ UPDATED: Bonus for EVERY machine purchase (unlimited)
async function checkReferralBonus(userId: string, machineId: string) {
  try {
    console.log('🎯 Checking for referral bonus for user:', userId)

    // Check if user was referred by someone
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_id', userId)
      .in('status', ['pending', 'active'])
      .maybeSingle()

    if (referralError || !referral) {
      console.log('ℹ️ No active referral found for user:', userId)
      return
    }

    console.log('✅ Found active referral:', referral.id)

    const referrerId = referral.referrer_id
    const bonusAmount = 1000 // 1000 XAF per machine

    // Check if referrer ALREADY got bonus for THIS SPECIFIC machine
    const { data: existingBonus } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', referrerId)
      .eq('type', 'referral_bonus')
      .eq('metadata->>machine_id', machineId)
      .eq('metadata->>referred_user_id', userId)
      .maybeSingle()

    if (existingBonus) {
      console.log('⚠️ Referrer already got bonus for this machine purchase')
      return
    }

    console.log('💰 Crediting 1000 XAF referral bonus to:', referrerId)

    // Update referrer's wallet balance
    const { data: referrer, error: referrerError } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', referrerId)
      .single()

    if (referrerError) {
      console.error('❌ Error fetching referrer data:', referrerError)
      return
    }

    const newBalance = (referrer.wallet_balance || 0) + bonusAmount

    const { error: updateError } = await supabase
      .from('users')
      .update({ wallet_balance: newBalance })
      .eq('id', referrerId)

    if (updateError) {
      console.error('❌ Error updating referrer balance:', updateError)
      return
    }

    console.log('✅ Referrer balance updated:', { referrerId, newBalance })

    // Record bonus transaction for referrer
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: referrerId,
        type: 'referral_bonus',
        description: `🎉 Referral bonus - user purchased a machine!`,
        amount: bonusAmount,
        currency: 'XAF',
        status: 'completed',
        external_id: `ref_bonus_${referral.id}_${machineId}_${Date.now()}`,
        metadata: {
          referred_user_id: userId,
          machine_id: machineId,
          referral_id: referral.id
        }
      })

    if (transactionError) {
      console.error('❌ Error recording referral transaction:', transactionError)
    }

    // Create notification for referrer - FIXED: No .catch()
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: referrerId,
        title: '🎉 Referral Bonus Earned!',
        message: `You earned 1,000 XAF because your referral purchased another machine!`,
        type: 'referral',
        related_id: referral.id.toString(),
        metadata: {
          bonus_amount: bonusAmount,
          referred_user_id: userId,
          machine_id: machineId
        }
      })

    if (notificationError) {
      console.warn('⚠️ Could not create notification:', notificationError)
    } else {
      console.log('✅ Notification created')
    }

    console.log('✅ Referral bonus credited successfully to:', referrerId)

  } catch (error) {
    console.error('❌ Referral bonus error:', error)
  }
}
