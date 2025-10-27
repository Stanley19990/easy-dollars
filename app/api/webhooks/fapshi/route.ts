import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const webhookData = await request.json()
    console.log('📩 Fapshi Webhook Received:', webhookData)

    const { transId, status, externalId, userId, amount } = webhookData

    // Update transaction status in database
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ 
        status: status.toLowerCase(),
        updated_at: new Date().toISOString()
      })
      .eq('fapshi_trans_id', transId)

    if (updateError) {
      console.error('❌ Transaction update error:', updateError)
    }

    console.log('🔄 Payment Status Updated:', { transId, status })

    // Activate machine if payment is successful
    if (status.toLowerCase() === 'successful') {
      await activateUserMachine(userId, externalId)
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function activateUserMachine(userId: string, externalId: string) {
  try {
    // Extract machine ID from externalId
    const parts = externalId.split('_')
    if (parts.length < 3) return
    
    const machineId = parts[1]

    console.log('🔧 Activating machine:', { userId, machineId })

    // Check if machine already activated
    const { data: existingMachine } = await supabase
      .from('user_machines')
      .select('id')
      .eq('user_id', userId)
      .eq('machine_type_id', parseInt(machineId))
      .single()

    if (existingMachine) {
      console.log('⚠️ Machine already activated')
      return
    }

    // Activate the machine
    const { data: userMachine, error } = await supabase
      .from('user_machines')
      .insert({
        user_id: userId,
        machine_type_id: parseInt(machineId),
        purchased_at: new Date().toISOString(),
        is_active: true,
        activated_at: new Date().toISOString(),
        last_claim_time: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Machine activation error:', error)
      return
    }

    console.log('✅ Machine activated:', userMachine.id)

  } catch (error) {
    console.error('❌ Activation error:', error)
  }
}