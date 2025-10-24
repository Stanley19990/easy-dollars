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
    
    console.log('🧪 SANDBOX Payment request:', { 
      amount, 
      machineId, 
      userId,
      phone: phone
    })

    // Generate unique external ID
    const externalId = `MACHINE_${machineId}_${userId}_${Date.now()}`

    // SANDBOX: Use EXACT format from their example - 9 digits, no 237 prefix
    const fapshiPayload = {
      amount: Math.round(amount),
      phone: phone, // Send as 9 digits (693837891) - NO 237 prefix for sandbox
      medium: medium, // "mobile money" or "orange money"
      name: userName || "Test User",
      email: userEmail || "test@easydollars.com",
      userId: userId,
      externalId: externalId,
      message: `Purchase ${machineName} - EasyDollars Sandbox`
    }

    console.log('📤 Calling SANDBOX with exact format:', fapshiPayload)

    const response = await fetch('https://sandbox.fapshi.com/direct-pay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apiuser': process.env.FAPSHI_API_USER!,
        'apikey': process.env.FAPSHI_API_KEY!
      },
      body: JSON.stringify(fapshiPayload)
    })

    const responseData = await response.json()
    console.log('📨 SANDBOX Response:', { 
      status: response.status, 
      data: responseData 
    })

    if (!response.ok) {
      throw new Error(responseData.message || `Sandbox payment failed: ${response.status}`)
    }

    // Save pending transaction
    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'machine_purchase',
      description: `Purchase ${machineName} - ${externalId} (SANDBOX)`,
      amount: -amount,
      currency: 'XAF',
      status: 'pending',
      external_id: externalId,
      fapshi_trans_id: responseData.transId,
      is_test: true
    })

    return NextResponse.json({
      success: true,
      message: 'SANDBOX: Payment request sent to your phone!',
      transId: responseData.transId,
      isSandbox: true
    })

  } catch (error: any) {
    console.error('❌ SANDBOX Payment error:', error)
    
    // Save failed transaction
    try {
      const { machineId, userId, machineName, amount } = await request.json()
      const externalId = `MACHINE_${machineId}_${userId}_${Date.now()}`
      
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'machine_purchase',
        description: `Purchase ${machineName} - ${externalId} (SANDBOX Failed)`,
        amount: -amount,
        currency: 'XAF',
        status: 'failed',
        external_id: externalId,
        error_message: error.message,
        is_test: true
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