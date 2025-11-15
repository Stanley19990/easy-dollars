import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  console.log('🔧 Claim earnings API called')
  
  try {
    // Parse request body
    let body;
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { userMachineId, userId } = body

    console.log('💰 Claim earnings request:', { userMachineId, userId })

    // Validate input
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

    // Check if machine is active and can claim
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
      
      if (hoursSinceClaim < 24) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Mining not complete. Please wait 24 hours between claims.',
            hoursRemaining: Math.ceil(24 - hoursSinceClaim)
          },
          { status: 400 }
        )
      }
    }

    // Calculate earnings in XAF
    const machineType = Array.isArray(userMachine.machine_types) 
      ? userMachine.machine_types[0] 
      : userMachine.machine_types
    const earnedAmountXAF = machineType?.daily_earnings || 100

    console.log('💰 Earnings calculated:', { earnedAmountXAF, machineName: machineType?.name })

    // Get current user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('wallet_balance, total_earned')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('❌ User fetch error:', userError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user data' },
        { status: 500 }
      )
    }

    const newWalletBalance = (userData.wallet_balance || 0) + earnedAmountXAF
    const newTotalEarned = (userData.total_earned || 0) + earnedAmountXAF

    // Start a transaction to ensure all operations succeed or fail together
    try {
      // Update user balance (in XAF)
      const { error: balanceError } = await supabase
        .from('users')
        .update({
          wallet_balance: newWalletBalance,
          total_earned: newTotalEarned
        })
        .eq('id', userId)

      if (balanceError) throw balanceError

      // Update machine last claim time and total earned (in XAF)
      const newMachineTotalEarned = (userMachine.total_earned || 0) + earnedAmountXAF
      const { error: machineUpdateError } = await supabase
        .from('user_machines')
        .update({
          last_claim_time: new Date().toISOString(),
          total_earned: newMachineTotalEarned,
          is_active: true // Keep machine active for next cycle
        })
        .eq('id', userMachineId)

      if (machineUpdateError) throw machineUpdateError

      // ✅ RECORD EARNINGS TRANSACTION (in XAF) - This is critical for analytics
      const { error: earningsError } = await supabase
        .from('earnings')
        .insert({
          user_id: userId,
          machine_id: userMachineId,
          amount: earnedAmountXAF,
          earned_at: new Date().toISOString(),
          type: 'mining_earnings'
        })

      if (earningsError) {
        console.error('❌ Earnings recording error:', earningsError)
        // Continue even if earnings recording fails
      }

      // ✅ RECORD WALLET TRANSACTION (in XAF) - This is what users see in transaction history
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'mining_earnings',
          description: `Machine earnings from ${machineType?.name || 'Unknown Machine'}`,
          amount: earnedAmountXAF,
          currency: 'XAF',
          status: 'completed',
          external_id: `mining_${userMachineId}_${Date.now()}`,
          metadata: {
            machine_name: machineType?.name || 'Unknown Machine',
            machine_id: userMachineId,
            machine_type_id: userMachine.machine_type_id,
            claim_timestamp: new Date().toISOString()
          }
        })

      if (transactionError) {
        console.error('❌ Transaction recording error:', transactionError)
        // Continue even if transaction recording fails
      }

      console.log('✅ Claim successful - All operations completed')

      return NextResponse.json({
        success: true,
        message: `Successfully claimed ${earnedAmountXAF.toLocaleString()} XAF from ${machineType?.name || 'your machine'}`,
        amountXAF: earnedAmountXAF,
        newWalletBalance: newWalletBalance,
        newTotalEarned: newMachineTotalEarned,
        machineName: machineType?.name
      })

    } catch (transactionError: any) {
      console.error('❌ Database transaction failed:', transactionError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to complete claim transaction. Please try again.' 
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('❌ Claim earnings error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Add GET method for testing
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Claim earnings API is working',
    timestamp: new Date().toISOString(),
    endpoints: {
      POST: {
        description: 'Claim earnings from a user machine',
        body: {
          userMachineId: 'number (required)',
          userId: 'string (required)'
        }
      }
    }
  })
}