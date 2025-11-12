'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Shield, CheckCircle, XCircle, FileText, Users } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { SectionCard } from '@/components/ui/section-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

interface Profile {
  id: string
  full_name: string | null
  role?: 'user' | 'manager' | 'admin'
}

interface LeaveRequest {
  id: string
  user_id: string
  leave_type: string
  start_date: string
  end_date: string
  total_days: number
  reason: string | null
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  created_at: string
}

export default function LeaveApprovalsPage() {
  const { user } = useAuth()
  const [me, setMe] = useState<Profile | null>(null)
  const [pending, setPending] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [rejectionNotes, setRejectionNotes] = useState<Record<string, string>>({})
  const [approveOpenId, setApproveOpenId] = useState<string | null>(null)
  const [rejectOpenId, setRejectOpenId] = useState<string | null>(null)
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')

  useEffect(() => {
    if (user) {
      bootstrap()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const bootstrap = async () => {
    if (!user) return
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      // fetch my profile (role)
      const { data: myProf } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', user.id)
        .single()
      setMe(myProf)

      // fetch all pending leaves (admin policies allow)
      const { data: leaves } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      setPending(leaves || [])
    } catch (e) {
      // noop
    } finally {
      setLoading(false)
    }
  }

  const approve = async (id: string) => {
    if (!user) return
    setActionId(id)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase
        .from('leave_requests')
        .update({ status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() })
        .eq('id', id)
      await bootstrap()
      toast({ title: 'Leave approved' })
    } catch (e: any) {
      toast({ title: 'Failed to approve', description: e?.message || 'Unexpected error', variant: 'destructive' })
    } finally {
      setActionId(null)
    }
  }

  const reject = async (id: string) => {
    if (!user) return
    setActionId(id)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      await supabase
        .from('leave_requests')
        .update({ status: 'rejected', rejection_reason: rejectionNotes[id] || null, approved_by: user.id, approved_at: new Date().toISOString() })
        .eq('id', id)
      await bootstrap()
      toast({ title: 'Leave rejected' })
    } catch (e: any) {
      toast({ title: 'Failed to reject', description: e?.message || 'Unexpected error', variant: 'destructive' })
    } finally {
      setActionId(null)
    }
  }

  const isAdmin = me?.role === 'admin'

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return pending.filter((r) => {
      const matchesType = !typeFilter || r.leave_type === typeFilter
      const matchesTerm = !term ||
        r.leave_type.toLowerCase().includes(term) ||
        (r.reason || '').toLowerCase().includes(term) ||
        r.user_id.toLowerCase().includes(term)
      return matchesType && matchesTerm
    })
  }, [pending, search, typeFilter])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    )
  }

  if (!loading && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full p-6">
          <SectionCard title="Access denied" description="You do not have permission to view this page.">
            <div />
          </SectionCard>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PageHeader title="Leave Approvals" description="Approve or reject employee leave requests" />

        <SectionCard>
          {!loading && (
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Input
                placeholder="Search user, type, or reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border rounded px-3 py-2"
              >
                <option value="">All types</option>
                <option value="vacation">vacation</option>
                <option value="sick">sick</option>
                <option value="personal">personal</option>
                <option value="maternity">maternity</option>
                <option value="paternity">paternity</option>
                <option value="bereavement">bereavement</option>
                <option value="unpaid">unpaid</option>
              </select>
            </div>
          )}
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-52" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Users className="h-12 w-12" />} title="No pending leave requests" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Total Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.user_id}</TableCell>
                      <TableCell className="capitalize">{req.leave_type}</TableCell>
                      <TableCell>
                        {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{req.total_days}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="space-y-2">
                          <p className="truncate">{req.reason || '—'}</p>
                          {actionId === req.id && (
                            <Input
                              placeholder="Rejection reason (optional)"
                              value={rejectionNotes[req.id] || ''}
                              onChange={(e) => setRejectionNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={req.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => setApproveOpenId(req.id)}
                            disabled={actionId === req.id}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRejectOpenId(req.id)}
                            disabled={actionId === req.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </SectionCard>
      </div>
      {/* Approve dialog */}
      <ConfirmDialog
        open={!!approveOpenId}
        title="Approve leave request?"
        description="This will mark the request as approved."
        confirmLabel="Approve"
        onConfirm={() => {
          if (approveOpenId) approve(approveOpenId)
        }}
        onOpenChange={(open) => !open && setApproveOpenId(null)}
      />

      {/* Reject dialog with optional reason */}
      <ConfirmDialog
        open={!!rejectOpenId}
        title="Reject leave request?"
        description="Optionally provide a rejection reason."
        confirmLabel="Reject"
        onConfirm={() => {
          if (rejectOpenId) reject(rejectOpenId)
        }}
        onOpenChange={(open) => !open && setRejectOpenId(null)}
      >
        {rejectOpenId && (
          <Input
            placeholder="Rejection reason (optional)"
            value={rejectionNotes[rejectOpenId] || ''}
            onChange={(e) => setRejectionNotes(prev => ({ ...prev, [rejectOpenId]: e.target.value }))}
          />
        )}
      </ConfirmDialog>
    </div>
  )
}
