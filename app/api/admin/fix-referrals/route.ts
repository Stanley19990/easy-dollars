import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting retroactive referral bonus fix...')

    // Get all pending referrals
    const { data: pendingReferrals, error: referralsError } = await supabase
      .from('referrals')
      .select('*')
      .eq('status', 'pending')
      .is('bonus', null)

    if (referralsError) {
      console.error('❌ Error fetching pending referrals:', referralsError)
      return NextResponse.json({ error: referralsError.message }, { status: 500 })
    }

    if (!pendingReferrals || pendingReferrals.length === 0) {
      console.log('ℹ️ No pending referrals to process')
      return NextResponse.json({ 
        success: true, 
        message: 'No pending referrals found',
        processed: 0 
      })
    }

    console.log(`📊 Found ${pendingReferrals.length} pending referrals to check`)

    let processedCount = 0
    let bonusesCredited = 0
    const results = []

    for (const referral of pendingReferrals) {
      try {
        const referredUserId = referral.referred_id
        const referrerId = referral.referrer_id

        console.log(`\n🔍 Checking referral ${referral.id} for user ${referredUserId}`)

        // Check if referred user has purchased any machines
        const { data: userMachines, error: machinesError } = await supabase
          .from('user_machines')
          .select('id, machine_type_id, purchased_at')
          .eq('user_id', referredUserId)
          .order('purchased_at', { ascending: true })

        if (machinesError) {
          console.error(`❌ Error checking machines for user ${referredUserId}:`, machinesError)
          results.push({
            referralId: referral.id,
            status: 'error',
            message: machinesError.message
          })
          continue
        }

        if (!userMachines || userMachines.length === 0) {
          console.log(`ℹ️ User ${referredUserId} has not purchased any machines yet`)
          results.push({
            referralId: referral.id,
            status: 'pending',
            message: 'User has not purchased any machines'
          })
          continue
        }

        // User has purchased at least one machine - credit the bonus!
        console.log(`✅ User ${referredUserId} has ${userMachines.length} machine(s). Crediting bonus...`)

        const bonusAmount = 1000 // 1000 XAF

        // Get referrer's current balance
        const { data: referrer, error: referrerError } = await supabase
          .from('users')
          .select('wallet_balance')
          .eq('id', referrerId)
          .single()

        if (referrerError) {
          console.error(`❌ Error fetching referrer ${referrerId}:`, referrerError)
          results.push({
            referralId: referral.id,
            status: 'error',
            message: `Could not fetch referrer: ${referrerError.message}`
          })
          continue
        }

        const newBalance = (referrer.wallet_balance || 0) + bonusAmount

        // Update referrer's wallet
        const { error: updateBalanceError } = await supabase
          .from('users')
          .update({ wallet_balance: newBalance })
          .eq('id', referrerId)

        if (updateBalanceError) {
          console.error(`❌ Error updating balance for ${referrerId}:`, updateBalanceError)
          results.push({
            referralId: referral.id,
            status: 'error',
            message: `Could not update balance: ${updateBalanceError.message}`
          })
          continue
        }

        // Update referral record
        const { error: updateReferralError } = await supabase
          .from('referrals')
          .update({
            status: 'completed',
            bonus: bonusAmount,
            completed_at: new Date().toISOString()
          })
          .eq('id', referral.id)

        if (updateReferralError) {
          console.error(`❌ Error updating referral ${referral.id}:`, updateReferralError)
          results.push({
            referralId: referral.id,
            status: 'error',
            message: `Could not update referral: ${updateReferralError.message}`
          })
          continue
        }

        // Create transaction record
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: referrerId,
            type: 'referral_bonus',
            description: `Retroactive referral bonus from user ${referredUserId}`,
            amount: bonusAmount,
            currency: 'XAF',
            status: 'completed',
            external_id: `retroactive_ref_bonus_${referral.id}_${Date.now()}`,
            metadata: {
              referred_user_id: referredUserId,
              referral_id: referral.id,
              retroactive: true,
              machine_count: userMachines.length
            }
          })

        if (transactionError) {
          console.warn(`⚠️ Could not create transaction record:`, transactionError)
        }

        // Create notification
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: referrerId,
            title: '🎉 Referral Bonus Credited!',
            message: `You earned 1,000 XAF from your referral! This bonus was retroactively applied.`,
            type: 'referral',
            related_id: referral.id.toString(),
            metadata: {
              bonus_amount: bonusAmount,
              referred_user_id: referredUserId,
              retroactive: true
            }
          })

        if (notificationError) {
          console.warn(`⚠️ Could not create notification:`, notificationError)
        }

        console.log(`✅ Successfully credited ${bonusAmount} XAF to ${referrerId}`)
        
        processedCount++
        bonusesCredited += bonusAmount

        results.push({
          referralId: referral.id,
          referrerId: referrerId,
          referredUserId: referredUserId,
          status: 'completed',
          bonusAmount: bonusAmount,
          machineCount: userMachines.length
        })

      } catch (error: any) {
        console.error(`❌ Error processing referral ${referral.id}:`, error)
        results.push({
          referralId: referral.id,
          status: 'error',
          message: error.message
        })
      }
    }

    console.log('\n✅ Retroactive fix completed!')
    console.log(`📊 Processed: ${processedCount} referrals`)
    console.log(`💰 Total bonuses credited: ${bonusesCredited} XAF`)

    return NextResponse.json({
      success: true,
      message: 'Retroactive referral fix completed',
      totalChecked: pendingReferrals.length,
      processed: processedCount,
      totalBonusesCredited: bonusesCredited,
      results: results
    })

  } catch (error: any) {
    console.error('❌ Retroactive fix error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET method to check status
export async function GET() {
  try {
    const { data: pendingReferrals, error } = await supabase
      .from('referrals')
      .select('id, referrer_id, referred_id')
      .eq('status', 'pending')
      .is('bonus', null)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      pendingReferralsCount: pendingReferrals?.length || 0,
      message: 'Use POST method to run the retroactive fix'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}