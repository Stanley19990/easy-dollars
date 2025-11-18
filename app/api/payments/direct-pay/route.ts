import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { 
      amount, 
      machineId, 
      userId, 
      machineName, 
      phone,
      medium,
      userEmail,
      userName
    } = await request.json()
    
    console.log('💰 Secure payment request received:', { 
      amount, 
      machineId, 
      userId,
      phone: `***${phone.slice(-3)}` // Hide full phone in logs
    })

    // Validate required fields
    if (!amount || !machineId || !userId || !phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate amount (minimum 100 XAF as per Fapshi docs)
    if (amount < 100) {
      return NextResponse.json(
        { success: false, error: 'Amount must be at least 100 XAF' },
        { status: 400 }
      )
    }

    // Validate phone format
    if (phone.length !== 9 || !phone.startsWith('6')) {
      return NextResponse.json(
        { success: false, error: 'Phone must be 9 digits starting with 6' },
        { status: 400 }
      )
    }

    // Generate unique external ID for tracking
    const externalId = `MACHINE_${machineId}_${userId}_${Date.now()}`

    // Prepare payload according to Fapshi official documentation
    const fapshiPayload = {
      amount: Math.round(amount),
      phone: phone,
      medium: medium || "mobile money",
      name: userName || "Customer",
      email: userEmail || "customer@easydollars.com",
      userId: userId,
      externalId: externalId,
      message: `Purchase ${machineName} - EasyDollars`
    }

    console.log('📤 Calling Fapshi /direct-pay endpoint with secure credentials')

    // Make secure server-to-server API call
    const response = await fetch('https://live.fapshi.com/direct-pay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apiuser': process.env.FAPSHI_API_USER!, // From server environment
        'apikey': process.env.FAPSHI_API_KEY!     // From server environment
      },
      body: JSON.stringify(fapshiPayload)
    })

    const responseData = await response.json()
    console.log('📨 Fapshi response:', { 
      status: response.status, 
      data: responseData 
    })

    if (!response.ok) {
      // Handle Fapshi API errors - Check for insufficient balance specifically
      const errorMessage = responseData.message || responseData.error || `Payment failed: ${response.status}`
      
      // Check if this is an insufficient balance error
      if (errorMessage.toLowerCase().includes('insufficient') || 
          errorMessage.toLowerCase().includes('balance') ||
          errorMessage.toLowerCase().includes('fund') ||
          response.status === 402) { // 402 is Payment Required
        
        console.log('💸 Insufficient balance detected from Fapshi')
        return NextResponse.json({
          success: false,
          error: 'Insufficient balance in your mobile money account. Please recharge your account and try again.'
        }, { status: 400 })
      }
      
      // For other Fapshi errors, return the original message
      throw new Error(errorMessage)
    }

    // Save pending transaction to database
    const { error: dbError } = await supabase.from('transactions').insert({
      user_id: userId,
      type: 'machine_purchase',
      description: `Purchase ${machineName} - ${externalId}`,
      amount: -amount,
      currency: 'XAF',
      status: 'pending',
      external_id: externalId,
      fapshi_trans_id: responseData.transId,
      metadata: {
        machine_id: machineId,
        phone: `***${phone.slice(-3)}`,
        medium: medium
      }
    })

    if (dbError) {
      console.error('❌ Database error:', dbError)
      // Don't fail the payment if database save fails
    }

    // Process referral bonus if this is user's first machine purchase
    await processReferralBonus(userId, machineId)

    // Return success response to client
    return NextResponse.json({
      success: true,
      message: responseData.message || 'Payment request sent to your phone!',
      transId: responseData.transId,
      dateInitiated: responseData.dateInitiated
    })

  } catch (error: any) {
    console.error('❌ Secure payment error:', error)
    
    // Check if it's an insufficient balance error from our custom handling
    if (error.message && error.message.includes('Insufficient balance')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }
    
    // Return generic error message to client (don't expose internal details)
    return NextResponse.json(
      { success: false, error: 'Payment service temporarily unavailable. Please try again.' },
      { status: 500 }
    )
  }
}

// Function to process referral bonus
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
    if (userMachines && userMachines.length > 0) {
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
      // Don't fail the bonus if referral update fails
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
      // Don't fail the bonus if transaction recording fails
    }

    console.log('✅ Referral bonus credited successfully to:', referrerId)

  } catch (error) {
    console.error('❌ Referral bonus processing error:', error)
    // Don't fail the main payment if referral bonus fails
  }
}

// Add GET method for testing
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Payment API is working',
    timestamp: new Date().toISOString()
  })
}