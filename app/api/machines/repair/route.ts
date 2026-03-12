import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    console.log('🔧 Running repair for user:', userId)

    // Find all successful transactions that don't have corresponding machines
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'successful')
      .eq('type', 'machine_purchase')
      .order('created_at', { ascending: true })

    if (txError) {
      console.error('❌ Error fetching transactions:', txError)
      return NextResponse.json({ error: txError.message }, { status: 500 })
    }

    console.log(`📊 Found ${transactions?.length || 0} successful transactions`)

    let activatedCount = 0

    // Process each transaction
    for (const transaction of transactions || []) {
      const machineId = transaction.metadata?.machineId
      
      if (!machineId) {
        console.log('⚠️ No machineId in transaction metadata:', transaction.id)
        continue
      }

      // Check if machine already exists
      const { data: existing } = await supabase
        .from('user_machines')
        .select('id')
        .eq('user_id', userId)
        .eq('machine_type_id', parseInt(machineId))
        .maybeSingle()

      if (existing) {
        console.log(`✅ Machine ${machineId} already activated for transaction ${transaction.id}`)
        continue
      }

      // Activate the machine
      const { error: insertError } = await supabase
        .from('user_machines')
        .insert({
          user_id: userId,
          machine_type_id: parseInt(machineId),
          purchased_at: transaction.created_at || new Date().toISOString(),
          is_active: true,
          activated_at: new Date().toISOString(),
          last_claim_time: new Date().toISOString()
        })

      if (insertError) {
        console.error(`❌ Failed to activate machine for transaction ${transaction.id}:`, insertError)
      } else {
        activatedCount++
        console.log(`✅ Activated machine ${machineId} for transaction ${transaction.id}`)
      }
    }

    // Update machines_owned count
    const { count } = await supabase
      .from('user_machines')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    await supabase
      .from('users')
      .update({ machines_owned: count })
      .eq('id', userId)

    console.log(`✅ Repair complete. Activated ${activatedCount} machines. Total now: ${count}`)

    return NextResponse.json({ 
      success: true, 
      activated: activatedCount,
      total_machines: count 
    })

  } catch (error: any) {
    console.error('❌ Repair error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}