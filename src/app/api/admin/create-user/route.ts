import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Use existing server-side client that integrates with Next cookies
import { createClient as createServerSupabase } from '@/lib/supabase/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, full_name, role } = body as { email?: string; full_name?: string; role?: string }

    if (!email || !role) {
      return NextResponse.json({ error: 'email and role are required' }, { status: 400 })
    }

    // Verify admin from current session
    const supabaseForSession = await createServerSupabase()

    const { data: { user }, error: userErr } = await supabaseForSession.auth.getUser()
    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Read current user's role
    const { data: profile, error: profileErr } = await supabaseForSession
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileErr) {
      return NextResponse.json({ error: 'Failed to verify admin role' }, { status: 403 })
    }

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create user via service role
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server not configured: SUPABASE_SERVICE_ROLE_KEY missing' }, { status: 500 })
    }

    const supabaseAdmin = createServiceClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || null,
        role,
      },
    })

    if (createErr || !created?.user) {
      return NextResponse.json({ error: createErr?.message || 'Failed to create user' }, { status: 400 })
    }

    const newUserId = created.user.id

    // Upsert profile with role using service role to bypass RLS
    const { error: upsertErr } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUserId,
        full_name: full_name || null,
        role,
        is_active: true,
      }, { onConflict: 'id' })

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message || 'Failed to create profile' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, user_id: newUserId })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
