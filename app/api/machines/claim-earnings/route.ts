import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { NotificationService } from '@/lib/notification-service'

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

    // Calculate earnings - for now, use fixed daily earnings
    const machineType = userMachine.machine_types
    const earnedAmount = machineType.daily_earnings || 100

    console.log('💰 Earnings calculated:', earnedAmount)

    // Update user balance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('ed_balance, total_earned')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('❌ User fetch error:', userError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user data' },
        { status: 500 }
      )
    }

    const newBalance = (userData.ed_balance || 0) + earnedAmount
    const newTotalEarned = (userData.total_earned || 0) + earnedAmount

    // Update user balance
    const { error: balanceError } = await supabase
      .from('users')
      .update({
        ed_balance: newBalance,
        total_earned: newTotalEarned,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (balanceError) {
      console.error('❌ Balance update error:', balanceError)
      return NextResponse.json(
        { success: false, error: 'Failed to update user balance' },
        { status: 500 }
      )
    }

    // Record transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'earning_claim',
        description: `Earnings claim from ${machineType.name}`,
        amount: earnedAmount,
        currency: 'ED',
        status: 'completed',
        external_id: `claim_${userMachineId}_${Date.now()}`
      })
      .select()
      .single()

    if (transactionError) {
      console.error('❌ Transaction error:', transactionError)
      // Continue even if transaction recording fails
    }

    // Update machine last claim time
    const { error: machineUpdateError } = await supabase
      .from('user_machines')
      .update({
        last_claim_time: new Date().toISOString(),
        total_earned: (userMachine.total_earned || 0) + earnedAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', userMachineId)

    if (machineUpdateError) {
      console.error('❌ Machine update error:', machineUpdateError)
      // Continue even if machine update fails
    }

    console.log('✅ Claim successful')

    return NextResponse.json({
      success: true,
      message: `Successfully claimed ${earnedAmount} ED`,
      amount: earnedAmount,
      transactionId: transaction?.id
    })

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
    timestamp: new Date().toISOString()
  })
}