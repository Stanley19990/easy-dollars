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

    // Validate phone format
    if (phone.length !== 9 || !phone.startsWith('6')) {
      return NextResponse.json(
        { success: false, error: 'Phone must be 9 digits starting with 6' },
        { status: 400 }
      )
    }

    // ✅ FIX: Fetch machine with discount from database to validate price
    const { data: machine, error: machineError } = await supabase
      .from('machine_types')
      .select('*')
      .eq('id', parseInt(machineId))
      .single()

    if (machineError || !machine) {
      return NextResponse.json(
        { success: false, error: 'Machine not found' },
        { status: 404 }
      )
    }

    // ✅ FIX: Calculate discounted price securely on backend
    let finalPrice = machine.price
    const discountMachines = [50000, 100000, 150000]
    
    if (discountMachines.includes(machine.price)) {
      finalPrice = Math.round(machine.price * 0.95) // 5% discount
    }

    // ✅ FIX: Verify the amount matches the discounted price
    if (Math.abs(amount - finalPrice) > 1) { // Allow 1 XAF rounding difference
      console.error('❌ Price mismatch:', { sentAmount: amount, expectedPrice: finalPrice })
      return NextResponse.json(
        { success: false, error: 'Invalid price - please refresh the page' },
        { status: 400 }
      )
    }

    // ✅ FIX: Check if user already owns this machine type
    const { data: existingMachine } = await supabase
      .from('user_machines')
      .select('id')
      .eq('user_id', userId)
      .eq('machine_type_id', parseInt(machineId))
      .single()

    if (existingMachine) {
      console.log('⚠️ User already owns this machine:', { userId, machineId })
      return NextResponse.json(
        { success: false, error: 'You already own this machine type' },
        { status: 400 }
      )
    }

    // Generate unique external ID for tracking
    const externalId = `MACHINE_${machineId}_${userId}_${Date.now()}`

    // ✅ FIX: Check for duplicate pending payments for same machine
    const { data: pendingPayments } = await supabase
      .from('transactions')
      .select('id, external_id, status')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .ilike('external_id', `MACHINE_${machineId}_${userId}_%`)
      .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Last 10 minutes

    if (pendingPayments && pendingPayments.length > 0) {
      console.log('⚠️ Duplicate payment attempt detected:', { userId, machineId })
      return NextResponse.json(
        { 
          success: false, 
          error: 'You already have a pending payment for this machine. Please complete or wait for it to expire.'
        },
        { status: 409 }
      )
    }

    // Prepare payload according to Fapshi official documentation
    const fapshiPayload = {
      amount: Math.round(finalPrice), // Use validated discounted price
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
      amount: -finalPrice, // Store discounted amount
      currency: 'XAF',
      status: 'pending',
      external_id: externalId,
      fapshi_trans_id: responseData.transId,
      metadata: {
        machine_id: machineId,
        machine_name: machineName,
        original_price: machine.price,
        discounted_price: finalPrice,
        discount_applied: finalPrice !== machine.price,
        phone: `***${phone.slice(-3)}`,
        medium: medium
      }
    })

    if (dbError) {
      console.error('❌ Database error:', dbError)
      // Don't fail the payment if database save fails
    }

    // ✅ FIX: REMOVED referral bonus processing from here
    // It will be processed in webhook after successful payment confirmation

    // Return success response to client
    return NextResponse.json({
      success: true,
      message: responseData.message || 'Payment request sent to your phone!',
      transId: responseData.transId,
      externalId: externalId,
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

// Add GET method for testing
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Payment API is working',
    timestamp: new Date().toISOString()
  })
}