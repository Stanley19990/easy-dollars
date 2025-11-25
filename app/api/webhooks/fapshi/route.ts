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
    if (parts.length < 3) return
    
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
      console.log('⚠️ Machine already activated')
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

    // ✅ FIX: Process referral bonus AFTER successful payment (moved from direct-pay)
    await processReferralBonus(userId, machineId)

  } catch (error) {
    console.error('❌ Activation error:', error)
  }
}

// ✅ FIX: Referral bonus processing moved to webhook (after payment confirmation)
async function processReferralBonus(userId: string, machineId: string) {
  try {
    console.log('🎯 Checking for referral bonus for user:', userId)

    // Check if user was referred by someone
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_id', userId)
      .eq('status', 'pending')
      .single()

    if (referralError || !referral) {
      console.log('No pending referral found for user:', userId)
      return
    }

    // Check if this is user's first machine purchase
    const { data: userMachines, error: machinesError } = await supabase
      .from('user_machines')
      .select('id')
      .eq('user_id', userId)

    if (machinesError) {
      console.error('Error checking user machines:', machinesError)
      return
    }

    // Only credit bonus for first machine purchase
    if (userMachines && userMachines.length > 1) {
      console.log('User already has machines, no bonus credited')
      return
    }

    const referrerId = referral.referrer_id
    const bonusAmount = 5 // $5 bonus

    console.log('💰 Crediting $5 referral bonus to:', referrerId)

    // Update referrer's wallet balance
    const { data: referrer, error: referrerError } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', referrerId)
      .single()

    if (referrerError) {
      console.error('Error fetching referrer data:', referrerError)
      return
    }

    const newBalance = (referrer.wallet_balance || 0) + bonusAmount

    const { error: updateError } = await supabase
      .from('users')
      .update({ wallet_balance: newBalance })
      .eq('id', referrerId)

    if (updateError) {
      console.error('Error updating referrer balance:', updateError)
      return
    }

    // Update referral status to completed and set bonus
    const { error: updateReferralError } = await supabase
      .from('referrals')
      .update({ 
        status: 'completed',
        bonus: bonusAmount,
        completed_at: new Date().toISOString()
      })
      .eq('id', referral.id)

    if (updateReferralError) {
      console.error('Error updating referral:', updateReferralError)
    }

    // Record bonus transaction for referrer
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: referrerId,
        type: 'referral_bonus',
        description: `Referral bonus from ${userId}`,
        amount: bonusAmount,
        currency: 'USD',
        status: 'completed',
        external_id: `ref_bonus_${referral.id}_${Date.now()}`,
        metadata: {
          referred_user_id: userId,
          machine_id: machineId,
          referral_id: referral.id
        }
      })

    if (transactionError) {
      console.error('Error recording referral transaction:', transactionError)
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