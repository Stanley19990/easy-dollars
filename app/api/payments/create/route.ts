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
    
    console.log('💰 Direct payment request:', { amount, machineId, phone, medium })

    // Generate unique external ID
    const externalId = `MACHINE_${machineId}_${userId}_${Date.now()}`

    // Create Fapshi direct payment
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

    console.log('📤 Creating Fapshi direct payment:', fapshiPayload)

    const response = await fetch('https://live.fapshi.com/direct-pay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apiuser': process.env.FAPSHI_API_USER!,
        'apikey': process.env.FAPSHI_API_KEY!
      },
      body: JSON.stringify(fapshiPayload)
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.log('❌ Fapshi error:', errorData)
      throw new Error(errorData.message || `Payment failed: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('✅ Fapshi direct payment created:', data)

    // Save pending transaction
    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'machine_purchase',
      description: `Purchase ${machineName} - ${externalId}`,
      amount: -amount,
      currency: 'XAF',
      status: 'pending',
      external_id: externalId,
      fapshi_trans_id: data.transId
    })

    return NextResponse.json({
      success: true,
      message: 'Payment request sent to your phone!',
      transId: data.transId
    })

  } catch (error: any) {
    console.error('❌ Payment error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}