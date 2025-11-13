"use client"

import { useState, useEffect } from 'react'
import { BackButton } from '@/components/admin/BackButton'
import { PageHeader } from '@/components/ui/page-header'
import { SectionCard } from '@/components/ui/section-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

type ProfileLite = { id: string; full_name: string | null; employee_id: string | null }

type AttendanceRow = {
  id?: string
  user_id: string
  date: string
  check_in: string | null
  check_out: string | null
  break_start: string | null
  break_end: string | null
  total_break_minutes: number | null
  status: string | null
  work_mode: string | null
  location_name: string | null
}

export default function AdminAttendancePage() {
  const [profiles, setProfiles] = useState<ProfileLite[]>([])
  const [userId, setUserId] = useState('')
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [row, setRow] = useState<AttendanceRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadUsers = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, employee_id')
        .order('full_name', { ascending: true })
      setProfiles(users || [])
    } catch (_e) {
      // Removed auth redirect
    }
  }

  const selectedUser = profiles.find(p => p.id === userId) || null

  const fetchDay = async () => {
    if (!userId || !date) return
    setLoading(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch(`/api/admin/attendance?user_id=${encodeURIComponent(userId)}&date=${encodeURIComponent(date)}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to load attendance')
      const data = json.data as AttendanceRow | null
      if (data) setRow(data)
      else setRow({
        user_id: userId,
        date,
        check_in: null,
        check_out: null,
        break_start: null,
        break_end: null,
        total_break_minutes: 0,
        status: 'present',
        work_mode: 'office',
        location_name: null,
      })
    } catch (e: any) {
      setError(e?.message || 'Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }

  const toLocalInput = (iso: string | null) => {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n: number) => n.toString().padStart(2, '0')
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const hh = pad(d.getHours())
    const mi = pad(d.getMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
  }

  const fromLocalInput = (val: string) => {
    if (!val) return null
    const dateObj = new Date(val)
    return dateObj.toISOString()
  }

  const save = async () => {
    if (!row) return
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const patch = {
        check_in: row.check_in,
        check_out: row.check_out,
        break_start: row.break_start,
        break_end: row.break_end,
        total_break_minutes: row.total_break_minutes ?? 0,
        status: row.status || 'present',
        work_mode: row.work_mode || 'office',
        location_name: row.location_name,
      }
      const res = await fetch('/api/admin/attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: row.user_id, date: row.date, patch }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to save')
      setRow(json.data)
      setMessage('Saved successfully')
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const del = async () => {
    if (!row) return
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/attendance', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: row.user_id, date: row.date }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to delete')
      setRow(null)
      setMessage('Deleted the day record')
    } catch (e: any) {
      setError(e?.message || 'Failed to delete')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <BackButton 
        href="/admin" 
        label="Back to Admin"
        action="push"
      />
      <PageHeader title="Attendance Editor" description="View and adjust check-in/out for any day" />

      <SectionCard title="Select Day" description="Pick a user and date to load their attendance">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">User</label>
            <select className="w-full border rounded px-3 py-2" value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">Select a user</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>
                  {(p.full_name || p.employee_id || p.id).toString()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input type="date" className="w-full border rounded px-3 py-2" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button disabled={!userId || !date || loading} onClick={fetchDay} className="bg-primary text-white px-4 py-2 rounded disabled:opacity-50">Load</button>
        </div>
      </SectionCard>

      {loading && (
        <div className="mt-4 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
            </div>
          ))}
        </div>
      )}
      {message && <div className="mt-4 text-green-700">{message}</div>}
      {error && <div className="mt-4 text-red-700">{error}</div>}

      {row && (
        <SectionCard title="Attendance Details" description="Edit fields and save to update the record" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Check In</label>
              <input type="datetime-local" className="w-full border rounded px-3 py-2" value={toLocalInput(row.check_in)} onChange={(e) => setRow({ ...row, check_in: fromLocalInput(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Check Out</label>
              <input type="datetime-local" className="w-full border rounded px-3 py-2" value={toLocalInput(row.check_out)} onChange={(e) => setRow({ ...row, check_out: fromLocalInput(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Break Start</label>
              <input type="datetime-local" className="w-full border rounded px-3 py-2" value={toLocalInput(row.break_start)} onChange={(e) => setRow({ ...row, break_start: fromLocalInput(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Break End</label>
              <input type="datetime-local" className="w-full border rounded px-3 py-2" value={toLocalInput(row.break_end)} onChange={(e) => setRow({ ...row, break_end: fromLocalInput(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total Break Minutes</label>
              <input type="number" className="w-full border rounded px-3 py-2" value={row.total_break_minutes ?? 0} onChange={(e) => setRow({ ...row, total_break_minutes: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select className="w-full border rounded px-3 py-2" value={row.status || 'present'} onChange={(e) => setRow({ ...row, status: e.target.value })}>
                <option value="present">present</option>
                <option value="absent">absent</option>
                <option value="late">late</option>
                <option value="early_leave">early_leave</option>
                <option value="half_day">half_day</option>
                <option value="holiday">holiday</option>
                <option value="sick_leave">sick_leave</option>
                <option value="vacation">vacation</option>
                <option value="remote">remote</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Work Mode</label>
              <select className="w-full border rounded px-3 py-2" value={row.work_mode || 'office'} onChange={(e) => setRow({ ...row, work_mode: e.target.value })}>
                <option value="office">office</option>
                <option value="remote">remote</option>
                <option value="hybrid">hybrid</option>
                <option value="field">field</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Location</label>
              <input type="text" className="w-full border rounded px-3 py-2" value={row.location_name || ''} onChange={(e) => setRow({ ...row, location_name: e.target.value })} />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <button disabled={saving} onClick={save} className="bg-primary text-white px-4 py-2 rounded disabled:opacity-50">Save Changes</button>
            <button disabled={saving} onClick={() => setRow({ ...row, check_out: null })} className="border px-4 py-2 rounded">Clear Check-out</button>
            <button disabled={saving} onClick={() => setRow({ ...row, check_in: null })} className="border px-4 py-2 rounded">Clear Check-in</button>
            <button disabled={saving} onClick={del} className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50">Delete Day</button>
          </div>
        </SectionCard>
      )}

      <p className="mt-6 text-sm text-muted-foreground">Admins can adjust any day regardless of user grace windows.</p>
    </div>
  )
}
