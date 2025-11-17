'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar as CalendarIcon, Filter, Download, Search, Clock, MapPin, Coffee, CheckCircle, XCircle, AlertCircle, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'

interface Attendance {
  id: string
  user_id: string
  date: string
  check_in: string
  check_out: string | null
  break_start: string | null
  break_end: string | null
  total_break_minutes: number
  status: 'present' | 'absent' | 'late' | 'early_leave' | 'half_day' | 'holiday' | 'sick_leave' | 'vacation' | 'remote'
  work_mode: 'office' | 'remote' | 'hybrid' | 'field'
  location_name: string | null
  notes: string | null
}

export default function HistoryPage() {
  const { user } = useAuth()
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [filteredAttendance, setFilteredAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [workModeFilter, setWorkModeFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isManager, setIsManager] = useState(false)
  const [profiles, setProfiles] = useState<Array<{ id: string; full_name: string | null; employee_id: string | null }>>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      bootstrap()
    }
  }, [user])

  useEffect(() => {
    filterAttendance()
  }, [attendance, searchTerm, statusFilter, workModeFilter, dateRange])

  const bootstrap = async () => {
    setLoading(true)
    try {
      if (!user) return
      // Determine role
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      const manager = me?.role === 'admin' || me?.role === 'manager'
      setIsManager(!!manager)
      setSelectedUserId(user.id)
      if (manager) {
        const { data: ppl } = await supabase.from('profiles').select('id, full_name, employee_id').order('full_name', { ascending: true })
        setProfiles(ppl || [])
      }
      await fetchAttendanceHistory(user.id)
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendanceHistory = async (targetUserId?: string) => {
    if (!user) return

    try {
      const target = targetUserId || user.id
      if (isManager && target !== user.id) {
        const res = await fetch(`/api/manager/attendance?user_id=${encodeURIComponent(target)}&limit=200`)
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to load attendance')
        setAttendance(json.data || [])
      } else {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .eq('user_id', target)
          .order('date', { ascending: false })
          .limit(200)
        if (error) throw error
        setAttendance(data || [])
      }
    } catch (error) {
      console.error('Error fetching attendance history:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAttendance = () => {
    let filtered = [...attendance]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.location_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.date.includes(searchTerm)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter)
    }

    // Work mode filter
    if (workModeFilter !== 'all') {
      filtered = filtered.filter(record => record.work_mode === workModeFilter)
    }

    // Date range filter
    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date)
        return recordDate >= dateRange.from! && recordDate <= dateRange.to!
      })
    }

    setFilteredAttendance(filtered)
    setCurrentPage(1)
  }

  // StatusBadge used for consistent status styling

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateWorkHours = (checkIn: string, checkOut: string | null, breakMinutes: number = 0) => {
    if (!checkOut) return 'In progress'
    
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const diff = end.getTime() - start.getTime()
    const totalMinutes = Math.floor(diff / (1000 * 60)) - breakMinutes
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    return `${hours}h ${minutes}m`
  }

  const exportToCSV = (rows: Attendance[], suffix: string) => {
    const headers = ['Date', 'Status', 'Work Mode', 'Check In', 'Check Out', 'Break Time', 'Work Hours', 'Location', 'Notes']
    const csvData = rows.map(record => [
      new Date(record.date).toLocaleDateString(),
      record.status,
      record.work_mode,
      formatTime(record.check_in),
      record.check_out ? formatTime(record.check_out) : 'N/A',
      `${record.total_break_minutes}m`,
      calculateWorkHours(record.check_in, record.check_out, record.total_break_minutes),
      record.location_name || 'N/A',
      record.notes || 'N/A'
    ])

    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance_history_${suffix}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = filteredAttendance.slice(startIndex, endIndex)

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => window.history.back()}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-semibold text-foreground">Attendance History</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={() => exportToCSV(currentData, 'current_page')} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Current Page
              </Button>
              <Button onClick={() => exportToCSV(filteredAttendance, 'all_filtered')} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export All (Filtered)
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-8 border-0 shadow-lg bg-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter your attendance records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {isManager && (
                <div className="space-y-2 lg:col-span-2">
                  <Label htmlFor="user">User</Label>
                  <Select value={selectedUserId || ''} onValueChange={(v) => { setSelectedUserId(v); setCurrentPage(1); setLoading(true); fetchAttendanceHistory(v) }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={user!.id}>Me</SelectItem>
                      {profiles.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {(p.full_name || p.employee_id || p.id).toString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search notes, location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="early_leave">Early Leave</SelectItem>
                    <SelectItem value="half_day">Half Day</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="sick_leave">Sick Leave</SelectItem>
                    <SelectItem value="vacation">Vacation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Work Mode Filter */}
              <div className="space-y-2">
                <Label htmlFor="workMode">Work Mode</Label>
                <Select value={workModeFilter} onValueChange={setWorkModeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Modes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modes</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="field">Field</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    const today = new Date()
                    setDateRange({ from: today, to: today })
                  }}>Today</Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    const now = new Date()
                    const day = now.getDay()
                    const diffToMonday = (day + 6) % 7
                    const monday = new Date(now)
                    monday.setDate(now.getDate() - diffToMonday)
                    const sunday = new Date(monday)
                    sunday.setDate(monday.getDate() + 6)
                    setDateRange({ from: monday, to: sunday })
                  }}>This Week</Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    const now = new Date()
                    const first = new Date(now.getFullYear(), now.getMonth(), 1)
                    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                    setDateRange({ from: first, to: last })
                  }}>This Month</Button>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                    setWorkModeFilter('all')
                    setDateRange(undefined)
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-muted-foreground">
            Showing {currentData.length} of {filteredAttendance.length} records
          </p>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Rows per page</span>
              <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1) }}>
                <SelectTrigger className="w-20 h-8 text-sm">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Attendance Table */}
        <Card className="border-0 shadow-lg bg-card">
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>
              Your detailed attendance history
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="grid grid-cols-3 md:grid-cols-9 gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-14" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ))}
              </div>
            ) : currentData.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No attendance records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Work Mode</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Break Time</TableHead>
                      <TableHead>Work Hours</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((record) => (
                      <TableRow key={record.id} className="hover:bg-muted/40">
                        <TableCell className="font-medium">
                          {new Date(record.date).toLocaleDateString('en-US', { 
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>
                          <StatusBadge value={record.status} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {record.work_mode}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatTime(record.check_in)}</TableCell>
                        <TableCell>
                          {record.check_out ? formatTime(record.check_out) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Coffee className="h-4 w-4 mr-1 text-muted-foreground" />
                            {record.total_break_minutes}m
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {calculateWorkHours(record.check_in, record.check_out, record.total_break_minutes)}
                        </TableCell>
                        <TableCell>
                          {record.location_name ? (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                              {record.location_name}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {record.notes || <span className="text-muted-foreground">No notes</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}