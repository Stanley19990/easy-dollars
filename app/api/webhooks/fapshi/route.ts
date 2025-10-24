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

    const { id, status, externalId, userId, amount } = webhookData

    // Update transaction status
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ 
        status: status.toLowerCase()
      })
      .eq('external_id', externalId)

    if (updateError) {
      console.error('❌ Transaction update error:', updateError)
    }

    console.log('🔄 Payment Status:', status)

    // Activate machine if payment successful
    if (status.toLowerCase() === 'successful') {
      await activateUserMachine(userId, externalId, amount)
    }

    console.log('✅ Webhook processed successfully')
    return NextResponse.json({ received: true })

  } catch (error: any) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function activateUserMachine(userId: string, externalId: string, amount: number) {
  try {
    const parts = externalId.split('_')
    if (parts.length < 3) {
      console.log('❌ Invalid externalId format:', externalId)
      return
    }
    
    const machineId = parts[1]

    console.log('🔧 Activating machine from webhook:', { userId, machineId })

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

    console.log('✅ Machine activated from webhook:', userMachine.id)

  } catch (error) {
    console.error('❌ Activation error:', error)
  }
}