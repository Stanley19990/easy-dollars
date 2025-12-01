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

    const { transId, status, externalId, userId, amount } = webhookData

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

    // Update transaction status in database
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ 
        status: status.toLowerCase(),
        updated_at: new Date().toISOString()
      })
      .eq('fapshi_trans_id', transId)

    if (updateError) {
      console.error('❌ Transaction update error:', updateError)
    }

    console.log('🔄 Payment Status Updated:', { transId, status })

    // ✅ FIX: Activate machine and process referral bonus if payment is successful
    if (status.toLowerCase() === 'successful') {
      await activateUserMachine(userId, externalId)
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function activateUserMachine(userId: string, externalId: string) {
  try {
    // Extract machine ID from externalId
    const parts = externalId.split('_')
    if (parts.length < 3) {
      console.error('❌ Invalid externalId format:', externalId)
      return
    }
    
    const machineId = parts[1]

    console.log('🔧 Activating machine:', { userId, machineId })

    // ✅ FIX: Check if machine already activated (prevent duplicates)
    const { data: existingMachine } = await supabase
      .from('user_machines')
      .select('id')
      .eq('user_id', userId)
      .eq('machine_type_id', parseInt(machineId))
      .single()

    if (existingMachine) {
      console.log('⚠️ Machine already activated, skipping activation but checking referral')
      // Still process referral in case it was missed
      await processReferralBonus(userId, machineId)
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

    console.log('✅ Machine activated:', userMachine.id)

    // Update user's machines_owned count
    const { error: updateUserError } = await supabase.rpc('increment_machines_owned', {
      user_id_param: userId
    })

    if (updateUserError) {
      console.warn('⚠️ Could not update machines_owned count:', updateUserError)
    }

    // ✅ FIX: Process referral bonus AFTER successful payment
    await processReferralBonus(userId, machineId)

  } catch (error) {
    console.error('❌ Activation error:', error)
  }
}

// ✅ FIXED: Referral bonus processing with correct logic
async function processReferralBonus(userId: string, machineId: string) {
  try {
    console.log('🎯 Checking for referral bonus for user:', userId)

    // ✅ FIX: Check if user was referred by someone (with correct status check)
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_id', userId)
      .eq('status', 'pending')
      .single()

    if (referralError || !referral) {
      console.log('ℹ️ No pending referral found for user:', userId)
      return
    }

    console.log('✅ Found pending referral:', referral.id)

    // ✅ FIX: Check if this is user's FIRST machine purchase
    const { data: userMachines, error: machinesError } = await supabase
      .from('user_machines')
      .select('id')
      .eq('user_id', userId)

    if (machinesError) {
      console.error('❌ Error checking user machines:', machinesError)
      return
    }

    const machineCount = userMachines?.length || 0
    console.log(`📊 User has ${machineCount} machine(s)`)

    // ✅ FIX: Only credit bonus for FIRST machine purchase (exactly 1 machine)
    if (machineCount !== 1) {
      console.log(`⚠️ User has ${machineCount} machines, not their first purchase. No bonus credited.`)
      return
    }

    const referrerId = referral.referrer_id
    const bonusAmount = 1000 // 1000 XAF bonus

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

    // ✅ FIX: Update referral status to completed with timestamp
    const { error: updateReferralError } = await supabase
      .from('referrals')
      .update({ 
        status: 'completed',
        bonus: bonusAmount,
        completed_at: new Date().toISOString()
      })
      .eq('id', referral.id)

    if (updateReferralError) {
      console.error('❌ Error updating referral:', updateReferralError)
      return
    }

    console.log('✅ Referral status updated to completed')

    // Record bonus transaction for referrer
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: referrerId,
        type: 'referral_bonus',
        description: `Referral bonus from user ${userId}`,
        amount: bonusAmount,
        currency: 'XAF',
        status: 'completed',
        external_id: `ref_bonus_${referral.id}_${Date.now()}`,
        metadata: {
          referred_user_id: userId,
          machine_id: machineId,
          referral_id: referral.id
        }
      })

    if (transactionError) {
      console.error('❌ Error recording referral transaction:', transactionError)
    } else {
      console.log('✅ Referral transaction recorded')
    }

    // Create notification for referrer
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: referrerId,
        title: '🎉 Referral Bonus Earned!',
        message: `You earned 1,000 XAF because your referral purchased their first machine!`,
        type: 'referral',
        related_id: referral.id.toString(),
        metadata: {
          bonus_amount: bonusAmount,
          referred_user_id: userId
        }
      })

    if (notificationError) {
      console.warn('⚠️ Could not create notification:', notificationError)
    }

    console.log('✅ Referral bonus credited successfully to:', referrerId)

  } catch (error) {
    console.error('❌ Referral bonus processing error:', error)
  }
}

// GET method for webhook verification
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Webhook endpoint is active',
    timestamp: new Date().toISOString()
  })
}