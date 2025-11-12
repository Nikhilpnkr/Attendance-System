import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string

async function assertManagerOrAdmin() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, status: 401 }
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!p || (p.role !== 'admin' && p.role !== 'manager')) return { ok: false as const, status: 403 }
  return { ok: true as const }
}

function svc() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Service role not configured')
  return createServiceClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
}

// GET /api/manager/attendance?user_id=...&limit=200
export async function GET(req: NextRequest) {
  const authz = await assertManagerOrAdmin()
  if (!authz.ok) return NextResponse.json({ error: 'Forbidden' }, { status: authz.status })

  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get('user_id')
  const limit = Number(searchParams.get('limit') || '200')
  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

  const supa = svc()
  const { data, error } = await supa
    .from('attendance')
    .select('*')
    .eq('user_id', user_id)
    .order('date', { ascending: false })
    .limit(limit)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
