import type { SupabaseClient } from "@supabase/supabase-js"
import { extractMachineId } from "@/lib/fapshi-payments"

const REFERRAL_BONUS_XAF = 1000

export async function fulfillMachinePurchase(supabase: SupabaseClient, transaction: any) {
  const userId = transaction?.user_id
  const machineId = extractMachineId(transaction)

  if (!userId || !machineId) {
    return { activated: false, bonusPaid: false, error: "Missing user or machine id" }
  }

  const machineTypeId = parseInt(machineId)
  if (!Number.isFinite(machineTypeId)) {
    return { activated: false, bonusPaid: false, error: "Invalid machine id" }
  }

  const { data: existingMachine } = await supabase
    .from("user_machines")
    .select("id")
    .eq("user_id", userId)
    .eq("machine_type_id", machineTypeId)
    .maybeSingle()

  let activated = false

  if (!existingMachine) {
    const { error: insertError } = await supabase.from("user_machines").insert({
      user_id: userId,
      machine_type_id: machineTypeId,
      purchased_at: transaction.created_at || new Date().toISOString(),
      is_active: true,
      activated_at: new Date().toISOString(),
      last_claim_time: new Date().toISOString()
    })

    if (insertError) {
      console.error("Machine activation failed:", insertError)
      return { activated: false, bonusPaid: false, error: insertError.message }
    }

    activated = true
  }

  await syncMachineCount(supabase, userId)
  const bonus = await processReferralBonusForMachine(supabase, userId, machineTypeId.toString())

  return { activated, bonusPaid: bonus.paid, bonusMessage: bonus.message }
}

export async function syncMachineCount(supabase: SupabaseClient, userId: string) {
  const { count } = await supabase
    .from("user_machines")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  await supabase
    .from("users")
    .update({ machines_owned: count || 0 })
    .eq("id", userId)

  return count || 0
}

async function findOrCreateReferral(supabase: SupabaseClient, userId: string) {
  const { data: existingReferral } = await supabase
    .from("referrals")
    .select("*")
    .eq("referred_id", userId)
    .in("status", ["pending", "active", "completed"])
    .maybeSingle()

  if (existingReferral) return existingReferral

  const { data: referredUser } = await supabase
    .from("users")
    .select("referred_by")
    .eq("id", userId)
    .maybeSingle()

  const referredBy = referredUser?.referred_by?.trim?.()
  if (!referredBy) return null

  let referrer: any = null

  const { data: referrerByCode } = await supabase
    .from("users")
    .select("id")
    .eq("referral_code", referredBy)
    .maybeSingle()

  referrer = referrerByCode

  if (!referrer) {
    const { data: referrerById } = await supabase
      .from("users")
      .select("id")
      .eq("id", referredBy)
      .maybeSingle()

    referrer = referrerById
  }

  if (!referrer?.id || referrer.id === userId) return null

  const { data: createdReferral, error } = await supabase
    .from("referrals")
    .insert({
      referrer_id: referrer.id,
      referred_id: userId,
      referral_date: new Date().toISOString(),
      bonus: 0,
      status: "pending"
    })
    .select("*")
    .single()

  if (error) {
    console.error("Referral repair insert failed:", error)
    return null
  }

  return createdReferral
}

export async function processReferralBonusForMachine(
  supabase: SupabaseClient,
  userId: string,
  machineId: string
) {
  const referral = await findOrCreateReferral(supabase, userId)

  if (!referral?.id || !referral?.referrer_id) {
    return { paid: false, message: "No referral found" }
  }

  const referrerId = referral.referrer_id
  const bonusExternalId = `ref_bonus_${referral.id}_${userId}_${machineId}`

  const { data: existingByExternalId } = await supabase
    .from("transactions")
    .select("id")
    .eq("user_id", referrerId)
    .eq("type", "referral_bonus")
    .eq("external_id", bonusExternalId)
    .maybeSingle()

  const { data: existingByMetadata } = await supabase
    .from("transactions")
    .select("id")
    .eq("user_id", referrerId)
    .eq("type", "referral_bonus")
    .eq("metadata->>machine_id", machineId)
    .eq("metadata->>referred_user_id", userId)
    .maybeSingle()

  if (existingByExternalId || existingByMetadata) {
    return { paid: false, message: "Referral bonus already paid" }
  }

  const { data: referrer, error: referrerError } = await supabase
    .from("users")
    .select("wallet_balance, total_earned")
    .eq("id", referrerId)
    .single()

  if (referrerError || !referrer) {
    console.error("Referrer fetch failed:", referrerError)
    return { paid: false, message: "Referrer not found" }
  }

  const { error: walletError } = await supabase
    .from("users")
    .update({
      wallet_balance: (referrer.wallet_balance || 0) + REFERRAL_BONUS_XAF,
      total_earned: (referrer.total_earned || 0) + REFERRAL_BONUS_XAF
    })
    .eq("id", referrerId)

  if (walletError) {
    console.error("Referral wallet credit failed:", walletError)
    return { paid: false, message: walletError.message }
  }

  const accumulatedBonus = (referral.bonus || 0) + REFERRAL_BONUS_XAF

  await supabase
    .from("referrals")
    .update({
      bonus: accumulatedBonus,
      status: "active",
      completed_at: new Date().toISOString()
    })
    .eq("id", referral.id)

  const { error: txError } = await supabase.from("transactions").insert({
    user_id: referrerId,
    type: "referral_bonus",
    description: "Referral bonus - referred user purchased a machine",
    amount: REFERRAL_BONUS_XAF,
    currency: "XAF",
    status: "completed",
    external_id: bonusExternalId,
    metadata: {
      referred_user_id: userId,
      machine_id: machineId,
      referral_id: referral.id,
      bonus_amount: REFERRAL_BONUS_XAF
    }
  })

  if (txError) {
    console.error("Referral transaction record failed:", txError)
  }

  await supabase
    .from("notifications")
    .insert({
      user_id: referrerId,
      title: "Referral Bonus Earned",
      message: `You earned ${REFERRAL_BONUS_XAF.toLocaleString()} XAF because your referral purchased a machine.`,
      type: "referral",
      related_id: referral.id.toString(),
      metadata: {
        bonus_amount: REFERRAL_BONUS_XAF,
        referred_user_id: userId,
        machine_id: machineId
      }
    })
    .then(({ error }) => {
      if (error) console.warn("Referral notification failed:", error)
    })

  return { paid: true, message: "Referral bonus paid" }
}
