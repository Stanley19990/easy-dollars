import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  console.log('🔧 Claim earnings API called')
  
  try {
    const body = await request.json()
    const { userMachineId, userId } = body

    console.log('💰 Claim earnings request:', { userMachineId, userId })

    if (!userMachineId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userMachineId and userId' },
        { status: 400 }
      )
    }

    // Get user machine data
    const { data: userMachine, error: machineError } = await supabase
      .from('user_machines')
      .select(`
        *,
        machine_types (*)
      `)
      .eq('id', userMachineId)
      .eq('user_id', userId)
      .single()

    if (machineError || !userMachine) {
      console.error('❌ Machine not found:', machineError)
      return NextResponse.json(
        { success: false, error: 'Machine not found or access denied' },
        { status: 404 }
      )
    }

    console.log('📊 Found machine:', userMachine.id)

    // Check if machine is active
    if (!userMachine.is_active) {
      return NextResponse.json(
        { success: false, error: 'Machine is not active. Start mining first.' },
        { status: 400 }
      )
    }

    // Check if 24 hours have passed since last claim
    if (userMachine.last_claim_time) {
      const lastClaim = new Date(userMachine.last_claim_time)
      const now = new Date()
      const hoursSinceClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60)
      
      console.log('⏰ Hours since last claim:', hoursSinceClaim)
      
      if (hoursSinceClaim < 24) {
        const hoursRemaining = Math.ceil(24 - hoursSinceClaim)
        return NextResponse.json(
          { 
            success: false, 
            error: `Mining not complete. Please wait ${hoursRemaining} more hours.`,
            hoursRemaining
          },
          { status: 400 }
        )
      }
    }

    // Get machine type data
    const machineType = Array.isArray(userMachine.machine_types) 
      ? userMachine.machine_types[0] 
      : userMachine.machine_types
    
    const earnedAmountXAF = machineType?.daily_earnings || 0

    if (earnedAmountXAF <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid earnings amount' },
        { status: 400 }
      )
    }

    console.log('💰 Earnings to claim:', { earnedAmountXAF, machineName: machineType?.name })

    // Get current user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('wallet_balance, total_earned')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      console.error('❌ User fetch error:', userError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user data' },
        { status: 500 }
      )
    }

    const currentWalletBalance = userData.wallet_balance || 0
    const currentTotalEarned = userData.total_earned || 0
    const newWalletBalance = currentWalletBalance + earnedAmountXAF
    const newTotalEarned = currentTotalEarned + earnedAmountXAF

    console.log('💵 Balance update:', {
      current: currentWalletBalance,
      adding: earnedAmountXAF,
      new: newWalletBalance
    })

    // Update user wallet_balance and total_earned
    const { error: balanceError } = await supabase
      .from('users')
      .update({
        wallet_balance: newWalletBalance,
        total_earned: newTotalEarned
      })
      .eq('id', userId)

    if (balanceError) {
      console.error('❌ Balance update error:', balanceError)
      throw balanceError
    }

    console.log('✅ User balance updated')

    // Update machine last_claim_time and total_earned
    const newMachineTotalEarned = (userMachine.total_earned || 0) + earnedAmountXAF
    const { error: machineUpdateError } = await supabase
      .from('user_machines')
      .update({
        last_claim_time: new Date().toISOString(),
        total_earned: newMachineTotalEarned,
        is_active: true // Keep active for next cycle
      })
      .eq('id', userMachineId)

    if (machineUpdateError) {
      console.error('❌ Machine update error:', machineUpdateError)
      throw machineUpdateError
    }

    console.log('✅ Machine updated')

    // Record earnings in earnings table
    const { error: earningsError } = await supabase
      .from('earnings')
      .insert({
        user_id: userId,
        machine_id: userMachineId,
        amount: earnedAmountXAF,
        earned_at: new Date().toISOString(),
        type: 'mining_claim'
      })

    if (earningsError) {
      console.error('⚠️ Earnings recording error:', earningsError)
      // Don't fail the claim if this fails
    }

    // Record transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'mining_earnings',
        description: `Mining claim from ${machineType?.name || 'Machine'}`,
        amount: earnedAmountXAF,
        currency: 'XAF',
        status: 'completed',
        external_id: `claim_${userMachineId}_${Date.now()}`,
        metadata: {
          machine_name: machineType?.name,
          machine_id: userMachineId,
          machine_type_id: userMachine.machine_type_id,
          claim_timestamp: new Date().toISOString()
        }
      })

    if (transactionError) {
      console.error('⚠️ Transaction recording error:', transactionError)
      // Don't fail the claim if this fails
    }

    console.log('✅ Claim completed successfully')

    return NextResponse.json({
      success: true,
      message: `Successfully claimed ${earnedAmountXAF.toLocaleString()} XAF!`,
      amountXAF: earnedAmountXAF,
      newWalletBalance: newWalletBalance,
      newTotalEarned: newTotalEarned,
      machineName: machineType?.name
    })

  } catch (error: any) {
    console.error('❌ Claim earnings error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Claim earnings API is working',
    timestamp: new Date().toISOString()
  })
}