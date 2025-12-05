// app/api/admin/restore-balance/route.ts - CREATE THIS NEW FILE
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { userId, amount } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      )
    }

    console.log('🔧 Restoring balance for user:', userId)

    // Get user's current balance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('wallet_balance, username, email')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('User not found:', userError)
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // If amount is provided, use it. Otherwise, restore from last transaction
    let restoreAmount = amount
    if (!restoreAmount) {
      // Find the last successful claim or bonus
      const { data: lastTransaction } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', userId)
        .in('type', ['mining_earnings', 'referral_bonus', 'social_bonus'])
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (lastTransaction) {
        restoreAmount = lastTransaction.amount
      } else {
        restoreAmount = 1000 // Default restore amount
      }
    }

    const newBalance = (userData.wallet_balance || 0) + restoreAmount

    // Update user balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ wallet_balance: newBalance })
      .eq('id', userId)

    if (updateError) {
      console.error('Balance update error:', updateError)
      throw updateError
    }

    // Create restoration transaction
    await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'balance_restoration',
        description: `Emergency balance restoration`,
        amount: restoreAmount,
        currency: 'XAF',
        status: 'completed',
        external_id: `restore_${Date.now()}`,
        metadata: {
          original_balance: userData.wallet_balance,
          restored_amount: restoreAmount,
          new_balance: newBalance,
          restored_at: new Date().toISOString()
        }
      })

    console.log('✅ Balance restored:', {
      userId,
      original: userData.wallet_balance,
      restored: restoreAmount,
      new: newBalance
    })

    return NextResponse.json({
      success: true,
      message: 'Balance restored successfully',
      originalBalance: userData.wallet_balance,
      restoredAmount: restoreAmount,
      newBalance: newBalance,
      user: {
        username: userData.username,
        email: userData.email
      }
    })

  } catch (error: any) {
    console.error('❌ Balance restoration error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}