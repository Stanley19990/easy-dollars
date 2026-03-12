// app/api/referrals/process-bonus/route.ts - UPDATED FOR UNLIMITED BONUSES
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const REFERRAL_BONUS_XAF = 1000

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      )
    }

    console.log('🎁 Processing referral bonus for user:', userId)

    // Get user's referral info
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('referred_by, username, email')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      console.log('❌ User not found or no referral data')
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    if (!userData.referred_by) {
      console.log('ℹ️ User was not referred by anyone')
      return NextResponse.json({ success: true, message: 'No referrer to reward' })
    }

    // Find the referrer by referral code
    const { data: referrerData, error: referrerError } = await supabase
      .from('users')
      .select('id, wallet_balance, total_earned, username')
      .eq('referral_code', userData.referred_by)
      .single()

    if (referrerError || !referrerData) {
      console.log('❌ Referrer not found')
      return NextResponse.json({ success: false, error: 'Referrer not found' }, { status: 404 })
    }

    // ✅ NEW: Get the latest machine purchase
    const { data: latestMachine, error: machineError } = await supabase
      .from('user_machines')
      .select('machine_type_id, purchased_at')
      .eq('user_id', userId)
      .order('purchased_at', { ascending: false })
      .limit(1)
      .single()

    if (machineError || !latestMachine) {
      console.error('❌ Failed to get latest machine:', machineError)
      return NextResponse.json({ success: false, error: 'Machine not found' }, { status: 404 })
    }

    const machineId = latestMachine.machine_type_id

    // ✅ NEW: Check if bonus was already given for THIS SPECIFIC machine
    const { data: existingBonus } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', referrerData.id)
      .eq('type', 'referral_bonus')
      .eq('metadata->>machine_id', machineId.toString())
      .eq('metadata->>referred_user_id', userId)
      .maybeSingle()

    if (existingBonus) {
      console.log('ℹ️ Bonus already given for this machine purchase')
      return NextResponse.json({
        success: true,
        message: 'Bonus already given for this machine'
      })
    }

    // ✅ NEW: Get count of how many machines user has (for messaging)
    const { count: machineCount } = await supabase
      .from('user_machines')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    console.log('💰 Crediting referral bonus:', {
      referrer: referrerData.username,
      referrerId: referrerData.id,
      amount: REFERRAL_BONUS_XAF,
      machineNumber: machineCount,
      machineId: machineId
    })

    // Credit referrer's wallet
    const newWalletBalance = (referrerData.wallet_balance || 0) + REFERRAL_BONUS_XAF
    const newTotalEarned = (referrerData.total_earned || 0) + REFERRAL_BONUS_XAF

    const { error: walletUpdateError } = await supabase
      .from('users')
      .update({
        wallet_balance: newWalletBalance,
        total_earned: newTotalEarned
      })
      .eq('id', referrerData.id)

    if (walletUpdateError) {
      console.error('❌ Failed to update referrer wallet:', walletUpdateError)
      throw walletUpdateError
    }

    console.log('✅ Referrer balance updated')

    // ✅ NEW: Update or create referral record
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', referrerData.id)
      .eq('referred_id', userId)
      .maybeSingle()

    if (existingReferral) {
      // Update existing referral record
      await supabase
        .from('referrals')
        .update({
          bonus: REFERRAL_BONUS_XAF,
          status: 'active',  // Keep active for future bonuses
          completed_at: new Date().toISOString()
        })
        .eq('referrer_id', referrerData.id)
        .eq('referred_id', userId)
    } else {
      // Create new referral record
      await supabase
        .from('referrals')
        .insert({
          referrer_id: referrerData.id,
          referred_id: userId,
          bonus: REFERRAL_BONUS_XAF,
          status: 'active',
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
    }

    // Create transaction record for referrer
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: referrerData.id,
        type: 'referral_bonus',
        description: `🎉 Referral bonus - User purchased machine #${machineCount}!`,
        amount: REFERRAL_BONUS_XAF,
        currency: 'XAF',
        status: 'completed',
        external_id: `referral_${userId}_${machineId}_${Date.now()}`,
        metadata: {
          referred_user_id: userId,
          referred_username: userData.username,
          machine_id: machineId,
          machine_number: machineCount,
          bonus_amount: REFERRAL_BONUS_XAF
        }
      })

    if (transactionError) {
      console.error('⚠️ Failed to create transaction record:', transactionError)
    }

    // Create notification for referrer
    await supabase
      .from('notifications')
      .insert({
        user_id: referrerData.id,
        title: '🎉 Referral Bonus Earned!',
        message: `You earned ${REFERRAL_BONUS_XAF.toLocaleString()} XAF because ${userData.username || 'your referral'} purchased machine #${machineCount}!`,
        type: 'referral',
        related_id: userId,
        metadata: {
          machine_number: machineCount,
          machine_id: machineId
        }
      })

    console.log('✅ Referral bonus processed successfully for machine #', machineCount)

    return NextResponse.json({
      success: true,
      message: `Referral bonus credited for machine #${machineCount}`,
      bonusAmount: REFERRAL_BONUS_XAF,
      referrerId: referrerData.id,
      machineNumber: machineCount
    })

  } catch (error: any) {
    console.error('❌ Referral bonus processing error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Referral bonus API is active - Now gives bonuses for EVERY machine purchase!',
    timestamp: new Date().toISOString()
  })
}