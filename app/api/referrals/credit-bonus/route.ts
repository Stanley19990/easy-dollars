import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, machineId } = await request.json()

    console.log('🎯 Processing referral bonus for user:', userId)

    // Check if user was referred
    const { data: referral, error: referralError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_id', userId)
      .eq('status', 'pending')
      .single()

    if (referralError || !referral) {
      console.log('No pending referral found for user:', userId)
      return NextResponse.json({ success: true, message: 'No referral bonus applicable' })
    }

    // Check if this is user's first machine purchase
    const { data: userMachines, error: machinesError } = await supabase
      .from('user_machines')
      .select('id')
      .eq('user_id', userId)

    if (machinesError) {
      console.error('Error checking user machines:', machinesError)
      return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 })
    }

    // Only credit bonus for first machine purchase
    if (userMachines && userMachines.length > 1) {
      console.log('User already has machines, no bonus credited')
      return NextResponse.json({ success: true, message: 'Not first machine purchase' })
    }

    const referrerId = referral.referrer_id
    const bonusAmount = 5 // $5 bonus

    console.log('💰 Crediting bonus to referrer:', referrerId)

    // Update referrer's wallet balance
    const { data: referrer, error: referrerError } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', referrerId)
      .single()

    if (referrerError) {
      console.error('Error fetching referrer data:', referrerError)
      return NextResponse.json({ success: false, error: 'Referrer not found' }, { status: 404 })
    }

    const newBalance = (referrer.wallet_balance || 0) + bonusAmount

    const { error: updateError } = await supabase
      .from('users')
      .update({ wallet_balance: newBalance })
      .eq('id', referrerId)

    if (updateError) {
      console.error('Error updating referrer balance:', updateError)
      return NextResponse.json({ success: false, error: 'Failed to update balance' }, { status: 500 })
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
      // Don't fail the bonus if referral update fails
    }

    // Record bonus transaction
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
      console.error('Error recording transaction:', transactionError)
      // Don't fail the bonus if transaction recording fails
    }

    console.log('✅ Referral bonus credited successfully')

    return NextResponse.json({
      success: true,
      message: 'Referral bonus credited',
      bonusAmount,
      referrerId
    })

  } catch (error: any) {
    console.error('❌ Referral bonus error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}