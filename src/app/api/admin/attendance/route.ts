import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string

async function assertAdmin() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, status: 401 }
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (p?.role !== 'admin') return { ok: false as const, status: 403 }
  return { ok: true as const }
}

function svc() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Service role not configured')
  return createServiceClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
}

// GET /api/admin/attendance?user_id=...&date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const admin = await assertAdmin()
  if (!admin.ok) return NextResponse.json({ error: 'Forbidden' }, { status: admin.status })

  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get('user_id')
  const date = searchParams.get('date')
  if (!user_id || !date) return NextResponse.json({ error: 'user_id and date required' }, { status: 400 })

  const supa = svc()
  const { data, error } = await supa.from('attendance').select('*').eq('user_id', user_id).eq('date', date).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

// PUT body: { user_id, date, patch: { check_in?, check_out?, break_start?, break_end?, total_break_minutes?, status?, work_mode?, location_name? } }
export async function PUT(req: NextRequest) {
  const admin = await assertAdmin()
  if (!admin.ok) return NextResponse.json({ error: 'Forbidden' }, { status: admin.status })

  const body = await req.json()
  const { user_id, date, patch } = body || {}
  if (!user_id || !date || !patch || typeof patch !== 'object') {
    return NextResponse.json({ error: 'user_id, date and patch required' }, { status: 400 })
  }
  const supa = svc()

  // Ensure record exists
  const { data: existing, error: selErr } = await supa.from('attendance').select('id').eq('user_id', user_id).eq('date', date).maybeSingle()
  if (selErr) return NextResponse.json({ error: selErr.message }, { status: 400 })

  if (!existing) {
    // Create if missing with provided fields (need at least check_in to be valid)
    const insert = { user_id, date, ...patch }
    const { data, error } = await supa.from('attendance').insert(insert).select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data })
  }

  const { data, error } = await supa.from('attendance').update(patch).eq('id', existing.id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

// DELETE body: { user_id, date } -> deletes that day record
export async function DELETE(req: NextRequest) {
  const admin = await assertAdmin()
  if (!admin.ok) return NextResponse.json({ error: 'Forbidden' }, { status: admin.status })
  const body = await req.json()
  const { user_id, date } = body || {}
  if (!user_id || !date) return NextResponse.json({ error: 'user_id and date required' }, { status: 400 })
  const supa = svc()
  const { error } = await supa.from('attendance').delete().eq('user_id', user_id).eq('date', date)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
