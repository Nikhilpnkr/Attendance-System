'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar as CalendarIcon, Plus, Clock, CheckCircle, XCircle, AlertCircle, FileText, Coffee, Home, Plane, Heart, Baby, Users, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, differenceInDays, addDays } from 'date-fns'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { BackButton } from '@/components/admin/BackButton'

interface LeaveRequest {
  id: string
  user_id: string
  leave_type: string
  start_date: string
  end_date: string
  total_days: number
  reason: string | null
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

interface LeaveBalance {
  vacation_days: number
  sick_days: number
  personal_days: number
  used_vacation: number
  used_sick: number
  used_personal: number
}

const leaveTypes = [
  { value: 'vacation', label: 'Vacation', icon: Plane, color: 'bg-blue-500' },
  { value: 'sick', label: 'Sick Leave', icon: Heart, color: 'bg-red-500' },
  { value: 'personal', label: 'Personal Leave', icon: Users, color: 'bg-green-500' },
  { value: 'maternity', label: 'Maternity Leave', icon: Baby, color: 'bg-pink-500' },
  { value: 'paternity', label: 'Paternity Leave', icon: Baby, color: 'bg-purple-500' },
  { value: 'bereavement', label: 'Bereavement', icon: Users, color: 'bg-gray-500' },
  { value: 'unpaid', label: 'Unpaid Leave', icon: DollarSign, color: 'bg-orange-500' }
]

export default function LeavePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [newRequest, setNewRequest] = useState({
    leave_type: '',
    start_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined,
    reason: ''
  })

  useEffect(() => {
    if (user) {
      fetchLeaveData()
    }
  }, [user])

  const { totalPages, page, currentData } = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(leaveRequests.length / itemsPerPage))
    const page = Math.min(currentPage, totalPages)
    const start = (page - 1) * itemsPerPage
    const end = start + itemsPerPage
    const currentData = leaveRequests.slice(start, end)
    return { totalPages, page, currentData }
  }, [leaveRequests, currentPage, itemsPerPage])

  const exportToCSV = (rows: LeaveRequest[], suffix: string) => {
    const headers = ['Type', 'Start Date', 'End Date', 'Total Days', 'Reason', 'Status', 'Submitted']
    const csvData = rows.map(r => [
      r.leave_type,
      new Date(r.start_date).toLocaleDateString(),
      new Date(r.end_date).toLocaleDateString(),
      String(r.total_days),
      r.reason || 'N/A',
      r.status,
      new Date(r.created_at).toLocaleDateString(),
    ])
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leave_requests_${suffix}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const fetchLeaveData = async () => {
    if (!user) return

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      // Fetch leave requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (requestsError) throw requestsError

      setLeaveRequests(requestsData || [])
      setCurrentPage(1)

      // Calculate leave balance (simplified - in real app, this would come from a separate table)
      const currentYear = new Date().getFullYear()
      const yearStart = `${currentYear}-01-01`
      const yearEnd = `${currentYear}-12-31`

      const { data: approvedLeaves } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .gte('start_date', yearStart)
        .lte('end_date', yearEnd)

      const balance = {
        vacation_days: 21,
        sick_days: 10,
        personal_days: 5,
        used_vacation: approvedLeaves?.filter(l => l.leave_type === 'vacation').reduce((sum, l) => sum + l.total_days, 0) || 0,
        used_sick: approvedLeaves?.filter(l => l.leave_type === 'sick').reduce((sum, l) => sum + l.total_days, 0) || 0,
        used_personal: approvedLeaves?.filter(l => l.leave_type === 'personal').reduce((sum, l) => sum + l.total_days, 0) || 0
      }

      setLeaveBalance(balance)
    } catch (error) {
      console.error('Error fetching leave data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitLeaveRequest = async () => {
    if (!user || !newRequest.leave_type || !newRequest.start_date || !newRequest.end_date) {
      return
    }

    setSubmitting(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const totalDays = differenceInDays(newRequest.end_date, newRequest.start_date) + 1

      const { data, error } = await supabase
        .from('leave_requests')
        .insert({
          user_id: user.id,
          leave_type: newRequest.leave_type,
          start_date: newRequest.start_date.toISOString().split('T')[0],
          end_date: newRequest.end_date.toISOString().split('T')[0],
          total_days: totalDays,
          reason: newRequest.reason || null,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      // Reset form
      setNewRequest({
        leave_type: '',
        start_date: undefined,
        end_date: undefined,
        reason: ''
      })
      setShowNewRequestDialog(false)

      // Refresh data
      await fetchLeaveData()
      toast({ title: 'Leave request submitted' })
    } catch (error: any) {
      console.error('Error submitting leave request:', error)
      toast({ title: 'Failed to submit request', description: error?.message || 'Unexpected error', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500'
      case 'rejected': return 'bg-red-500'
      case 'cancelled': return 'bg-gray-500'
      case 'pending': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      case 'cancelled': return <AlertCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getLeaveTypeInfo = (type: string) => {
    return leaveTypes.find(t => t.value === type) || leaveTypes[0]
  }

  const calculateRemainingDays = (type: string) => {
    if (!leaveBalance) return 0
    
    switch (type) {
      case 'vacation': return leaveBalance.vacation_days - leaveBalance.used_vacation
      case 'sick': return leaveBalance.sick_days - leaveBalance.used_sick
      case 'personal': return leaveBalance.personal_days - leaveBalance.used_personal
      default: return 0
    }
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <BackButton href="/" label="Back to Dashboard" />
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => window.history.back()}>
                ← Back
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Leave Management</h1>
            </div>
            <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>New Leave Request</DialogTitle>
                  <DialogDescription>
                    Submit a new leave request for approval
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="leave_type">Leave Type</Label>
                    <Select value={newRequest.leave_type} onValueChange={(value) => setNewRequest(prev => ({ ...prev, leave_type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        {leaveTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center">
                              <type.icon className="h-4 w-4 mr-2" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !newRequest.start_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newRequest.start_date ? format(newRequest.start_date, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newRequest.start_date}
                            onSelect={(date) => setNewRequest(prev => ({ ...prev, start_date: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !newRequest.end_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newRequest.end_date ? format(newRequest.end_date, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newRequest.end_date}
                            onSelect={(date) => setNewRequest(prev => ({ ...prev, end_date: date }))}
                            initialFocus
                            disabled={(date) => date < (newRequest.start_date || new Date())}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {newRequest.start_date && newRequest.end_date && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Total days: {differenceInDays(newRequest.end_date, newRequest.start_date) + 1}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason (Optional)</Label>
                    <Textarea
                      id="reason"
                      placeholder="Provide a reason for your leave request..."
                      value={newRequest.reason}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, reason: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowNewRequestDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSubmitLeaveRequest} 
                      disabled={submitting || !newRequest.leave_type || !newRequest.start_date || !newRequest.end_date}
                    >
                      {submitting ? 'Submitting...' : 'Submit Request'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Leave Balance Skeletons */}
        {loading && !leaveBalance && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-40 mb-4" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-2 w-full mt-3" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Leave Balance Cards */}
        {leaveBalance && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <Plane className="h-4 w-4 mr-2 text-blue-600" />
                  Vacation Leave
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {leaveBalance.vacation_days - leaveBalance.used_vacation}
                    </div>
                    <p className="text-xs text-gray-500">Days Remaining</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {leaveBalance.used_vacation} / {leaveBalance.vacation_days}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(leaveBalance.used_vacation / leaveBalance.vacation_days) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <Heart className="h-4 w-4 mr-2 text-red-600" />
                  Sick Leave
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {leaveBalance.sick_days - leaveBalance.used_sick}
                    </div>
                    <p className="text-xs text-gray-500">Days Remaining</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {leaveBalance.used_sick} / {leaveBalance.sick_days}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{ width: `${(leaveBalance.used_sick / leaveBalance.sick_days) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <Users className="h-4 w-4 mr-2 text-green-600" />
                  Personal Leave
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {leaveBalance.personal_days - leaveBalance.used_personal}
                    </div>
                    <p className="text-xs text-gray-500">Days Remaining</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {leaveBalance.used_personal} / {leaveBalance.personal_days}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(leaveBalance.used_personal / leaveBalance.personal_days) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Leave Requests */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Leave Requests
            </CardTitle>
            <CardDescription>
              Your leave request history and status
            </CardDescription>
            <div className="mt-3 flex items-center gap-2">
              <Button variant="outline" onClick={() => exportToCSV(currentData, 'current_page')}>
                <FileText className="h-4 w-4 mr-2" /> Export Current Page
              </Button>
              <Button variant="outline" onClick={() => exportToCSV(leaveRequests, 'all')}>
                <FileText className="h-4 w-4 mr-2" /> Export All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : leaveRequests.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No leave requests found</p>
                <Button onClick={() => setShowNewRequestDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Request
                </Button>
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentData.map((request) => {
                        const typeInfo = getLeaveTypeInfo(request.leave_type)
                        return (
                          <TableRow key={request.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="flex items-center">
                                <typeInfo.icon className="h-4 w-4 mr-2" />
                                <span className="capitalize">{typeInfo.label}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-600">{request.total_days} day(s)</p>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <p className="truncate">{request.reason || 'No reason provided'}</p>
                            </TableCell>
                            <TableCell>
                              <StatusBadge value={request.status} />
                            </TableCell>
                            <TableCell>
                              {new Date(request.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {request.status === 'pending' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={async () => {
                                    // Cancel request logic
                                    const { createClient } = await import('@/lib/supabase/client')
                                    const supabase = createClient()
                                     
                                    try {
                                      const { error } = await supabase
                                        .from('leave_requests')
                                        .update({ status: 'cancelled' })
                                        .eq('id', request.id)
                                      if (error) throw error
                                      await fetchLeaveData()
                                      toast({ title: 'Request cancelled' })
                                    } catch (e: any) {
                                      toast({ title: 'Failed to cancel', description: e?.message || 'Unexpected error', variant: 'destructive' })
                                    }
                                  }}
                                >
                                  Cancel
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                {/* Pagination */}
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">Showing page {page} of {totalPages}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}