import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Custom fetch with timeout and retry
async function robustFetch(url: string, options: any, timeout = 15000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

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
    
    console.log('💰 Creating payment request:', { 
      amount, 
      machineId, 
      userId,
      phone: `***${phone?.slice(-3)}`
    })

    // Generate unique external ID
    const externalId = `MACHINE_${machineId}_${userId}_${Date.now()}`

    // Create Fapshi payment using official /payment endpoint
    const fapshiPayload = {
      amount: Math.round(amount),
      phone: phone,
      medium: medium, // "mobile money" or "orange money"
      name: userName || "Customer",
      email: userEmail || "customer@easydollars.com",
      userId: userId,
      externalId: externalId,
      message: `Purchase ${machineName} - EasyDollars`
    }

    console.log('📤 Calling Fapshi /payment endpoint')

    let response;
    try {
      response = await robustFetch('https://live.fapshi.com/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apiuser': process.env.FAPSHI_API_USER!,
          'apikey': process.env.FAPSHI_API_KEY!
        },
        body: JSON.stringify(fapshiPayload)
      }, 15000) // 15 second timeout
    } catch (networkError: any) {
      console.error('❌ Network error calling Fapshi:', networkError)
      throw new Error('Cannot connect to payment service. Please try again in a few moments.')
    }

    let responseData;
    try {
      responseData = await response.json()
    } catch (parseError) {
      console.error('❌ Failed to parse Fapshi response:', parseError)
      throw new Error('Payment service returned invalid response. Please try again.')
    }

    console.log('📨 Fapshi /payment response:', { 
      status: response.status, 
      data: responseData 
    })

    if (!response.ok) {
      throw new Error(responseData.message || `Payment failed: ${response.status}`)
    }

    // Save pending transaction
    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'machine_purchase',
      description: `Purchase ${machineName} - ${externalId}`,
      amount: -amount,
      currency: 'XAF',
      status: 'pending',
      external_id: externalId,
      fapshi_trans_id: responseData.id || responseData.transId
    })

    return NextResponse.json({
      success: true,
      message: 'Payment request sent to your phone!',
      paymentId: responseData.id || responseData.transId,
      status: responseData.status
    })

  } catch (error: any) {
    console.error('❌ Payment API error:', error)
    
    // Save failed transaction
    try {
      const { machineId, userId, machineName, amount } = await request.json()
      const externalId = `MACHINE_${machineId}_${userId}_${Date.now()}`
      
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'machine_purchase',
        description: `Purchase ${machineName} - ${externalId} (Failed)`,
        amount: -amount,
        currency: 'XAF',
        status: 'failed',
        external_id: externalId,
        error_message: error.message
      })
    } catch (e) {
      console.log('Could not save failed transaction')
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}