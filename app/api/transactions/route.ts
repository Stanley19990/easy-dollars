import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { userId, machineId, machineName, amount, externalId, transId, type } = await request.json()

    console.log('💾 Saving transaction:', { externalId, transId, amount, machineId })

    // Save transaction to database with metadata
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: type || 'machine_purchase',
        description: `Purchase ${machineName}`,
        amount: -amount, // Negative for purchases
        currency: 'XAF',
        status: 'pending',
        external_id: externalId,
        fapshi_trans_id: transId,
        metadata: {
          machineId: machineId,           // ✅ CRITICAL: Save machine ID here
          machineName: machineName,
          machinePrice: amount,
          purchasedAt: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Transaction save error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log('✅ Transaction saved with metadata:', data.id)
    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    console.error('❌ Transaction API error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}