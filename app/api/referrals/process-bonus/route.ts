// app/api/referrals/process-bonus/route.ts - NEW FILE
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

    // Check if this is the user's FIRST machine purchase
    const { count: machineCount } = await supabase
      .from('user_machines')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (machineCount !== 1) {
      console.log(`ℹ️ User has ${machineCount} machines - bonus only for first purchase`)
      return NextResponse.json({
        success: true,
        message: 'Bonus only applies to first machine purchase'
      })
    }

    // Check if referral bonus already paid
    const { data: existingReferral, error: referralCheckError } = await supabase
      .from('referrals')
      .select('bonus, status')
      .eq('referrer_id', referrerData.id)
      .eq('referred_id', userId)
      .single()

    if (existingReferral && existingReferral.bonus > 0) {
      console.log('ℹ️ Referral bonus already paid')
      return NextResponse.json({
        success: true,
        message: 'Bonus already paid'
      })
    }

    console.log('💰 Crediting referral bonus:', {
      referrer: referrerData.username,
      referrerId: referrerData.id,
      amount: REFERRAL_BONUS_XAF
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

    // Update referral record with bonus
    const { error: referralUpdateError } = await supabase
      .from('referrals')
      .update({
        bonus: REFERRAL_BONUS_XAF,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('referrer_id', referrerData.id)
      .eq('referred_id', userId)

    if (referralUpdateError) {
      console.error('❌ Failed to update referral record:', referralUpdateError)
    }

    // Create transaction record for referrer
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: referrerData.id,
        type: 'referral_bonus',
        description: `Referral bonus from ${userData.username || userData.email || 'new user'}`,
        amount: REFERRAL_BONUS_XAF,
        currency: 'XAF',
        status: 'completed',
        external_id: `referral_${userId}_${Date.now()}`,
        metadata: {
          referred_user_id: userId,
          referred_username: userData.username,
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
        title: 'Referral Bonus Earned! 🎉',
        message: `You earned ${REFERRAL_BONUS_XAF.toLocaleString()} XAF because ${userData.username || 'your referral'} purchased their first machine!`,
        type: 'referral',
        related_id: userId
      })

    console.log('✅ Referral bonus processed successfully')

    return NextResponse.json({
      success: true,
      message: 'Referral bonus credited',
      bonusAmount: REFERRAL_BONUS_XAF,
      referrerId: referrerData.id
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
    message: 'Referral bonus API is active',
    timestamp: new Date().toISOString()
  })
}