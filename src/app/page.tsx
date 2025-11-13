'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Clock, Calendar, LogOut, User, CheckCircle, XCircle, TrendingUp, TrendingDown, AlertCircle, Coffee, MapPin, Timer, Home, Briefcase, FileText, BarChart3, Settings, ChevronRight, Users, Target, Award, Activity, Menu, X, Shield } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { useState, useEffect } from 'react'
import NotificationCenter from '@/components/NotificationCenter'
import Link from 'next/link'

interface Profile {
  id: string
  full_name: string
  employee_id: string
  department: string
  position: string
  work_schedule: string
  timezone: string
  avatar_url?: string
  role?: 'employee' | 'assistant' | 'manager' | 'admin'
}

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

interface AttendanceSummary {
  id: string
  period_type: string
  period_start: string
  period_end: string
  total_days: number
  present_days: number
  absent_days: number
  late_days: number
  early_leave_days: number
  leave_days: number
  holiday_days: number
  total_work_hours: number
  total_overtime_hours: number
  attendance_percentage: number
  punctuality_percentage: number
}

interface LeaveRequest {
  id: string
  leave_type: string
  start_date: string
  end_date: string
  total_days: number
  reason: string | null
  status: string
}

function SetupPage() {
  return <div>Loading setup...</div>
}

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [profile, setProfile] = useState<Profile | null>(null)
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null)
  const [monthlySummary, setMonthlySummary] = useState<AttendanceSummary | null>(null)
  const [recentAttendance, setRecentAttendance] = useState<Attendance[]>([])
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const { toast } = useToast()
  const UNDO_WINDOW_MINUTES = 10

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: authData, error: authErr } = await supabase.auth.getUser()
      if (authErr || !authData?.user) throw authErr || new Error('Not authenticated')
      const userId = authData.user.id

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .single()

      setProfile(profileData)

      const today = new Date().toISOString().split('T')[0]
      
      // Fetch today's attendance
      const { data: todayData } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', today)
        .single()

      setTodayAttendance(todayData)

      // Fetch monthly summary
      const currentMonth = new Date().toISOString().slice(0, 7)
      const { data: summaryData } = await supabase
        .from('attendance_summaries')
        .select('*')
        .eq('period_type', 'monthly')
        .like('period_start', `${currentMonth}%`)
        .single()

      setMonthlySummary(summaryData)

      // Fetch recent attendance (last 7 days)
      const { data: recentData } = await supabase
        .from('attendance')
        .select('*')
        .order('date', { ascending: false })
        .limit(7)

      setRecentAttendance(recentData || [])

      // Fetch pending leave requests
      const { data: leavesData } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      setPendingLeaves(leavesData || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const canUndoCheckout = () => {
    if (!todayAttendance || !todayAttendance.check_out) return false
    const diffMs = Date.now() - new Date(todayAttendance.check_out).getTime()
    const diffMinutes = diffMs / 60000
    return diffMinutes <= UNDO_WINDOW_MINUTES
  }

  const handleUndoCheckout = async () => {
    if (!todayAttendance || !todayAttendance.check_out) return
    if (!canUndoCheckout()) {
      setActionMessage(`Undo window expired. You can undo within ${UNDO_WINDOW_MINUTES} minutes of checkout.`)
      return
    }
    setActionLoading(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { error } = await supabase
        .from('attendance')
        .update({ check_out: null })
        .eq('id', todayAttendance.id)
      if (error) throw error
      await fetchDashboardData()
      setActionMessage('Checkout undone. You are currently checked in.')
      toast({ title: 'Undo successful' })
    } catch (e) {
      console.error('Undo checkout error:', e)
      setActionMessage('Failed to undo checkout. Please try again.')
      toast({ title: 'Undo failed', description: 'Please try again.', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckIn = async () => {
    setActionLoading(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data: authData, error: authErr } = await supabase.auth.getUser()
      if (authErr || !authData?.user) throw authErr || new Error('Not authenticated')
      const userId = authData.user.id

      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const checkInTime = now.toISOString()

      // Prevent re-check-in if a record exists for today
      const { data: existing } = await supabase
        .from('attendance')
        .select('id, check_out')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle()

      if (existing) {
        if (existing.check_out === null) {
          setActionMessage('You are already checked in for today.')
        } else {
          setActionMessage("Today's attendance is already completed.")
        }
        return
      }

      const { data, error } = await supabase
        .from('attendance')
        .insert({
          user_id: userId,
          date: today,
          check_in: checkInTime,
          status: 'present',
          work_mode: 'office',
          location_name: 'Office Location'
        })
        .select()
        .single()

      if (error) throw error

      setTodayAttendance(data)
      await fetchDashboardData()
      toast({ title: 'Checked in' })
    } catch (error: any) {
      console.error('Check-in error:', error)
      const msg = error?.code === '23505'
        ? 'You have already checked in today.'
        : 'Failed to check in. Please try again.'
      setActionMessage(msg)
      toast({ title: 'Check-in failed', description: msg, variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    if (!todayAttendance) return

    setActionLoading(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const now = new Date()
      const checkOutTime = now.toISOString()

      const { error } = await supabase
        .from('attendance')
        .update({
          check_out: checkOutTime
        })
        .eq('id', todayAttendance.id)

      if (error) throw error

      await fetchDashboardData()
      toast({ title: 'Checked out' })
    } catch (error: any) {
      console.error('Check-out error:', error)
      toast({ title: 'Check-out failed', description: 'Please try again.', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleBreakStart = async () => {
    if (!todayAttendance) return

    setActionLoading(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const now = new Date()

      const { error } = await supabase
        .from('attendance')
        .update({
          break_start: now.toISOString()
        })
        .eq('id', todayAttendance.id)

      if (error) throw error

      await fetchDashboardData()
      toast({ title: 'Break started' })
    } catch (error: any) {
      console.error('Break start error:', error)
      toast({ title: 'Failed to start break', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleBreakEnd = async () => {
    if (!todayAttendance) return

    setActionLoading(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const now = new Date()

      const { error } = await supabase
        .from('attendance')
        .update({
          break_end: now.toISOString()
        })
        .eq('id', todayAttendance.id)

      if (error) throw error

      await fetchDashboardData()
      toast({ title: 'Break ended' })
    } catch (error: any) {
      console.error('Break end error:', error)
      toast({ title: 'Failed to end break', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-500'
      case 'late': return 'bg-yellow-500'
      case 'absent': return 'bg-red-500'
      case 'early_leave': return 'bg-orange-500'
      case 'half_day': return 'bg-blue-500'
      case 'remote': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-3 w-3 mr-1" />
      case 'late': return <AlertCircle className="h-3 w-3 mr-1" />
      case 'absent': return <XCircle className="h-3 w-3 mr-1" />
      case 'early_leave': return <TrendingDown className="h-3 w-3 mr-1" />
      default: return <Clock className="h-3 w-3 mr-1" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 bg-white rounded-lg shadow">
                <Skeleton className="h-4 w-36 mb-3" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-40" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isCheckedIn = todayAttendance && !todayAttendance.check_out
  const isOnBreak = todayAttendance && todayAttendance.break_start && !todayAttendance.break_end

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Welcome back! 👋
              </h2>
              <p className="text-gray-600 mt-1">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                {currentTime.toLocaleTimeString()}
              </div>
              <p className="text-sm text-gray-500">Current Time</p>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        {profile && (
          <Card className="mb-8 border-0 shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16 border-4 border-white/20">
                    <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                    <AvatarFallback className="bg-white/20 text-white text-xl">
                      {profile.full_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-2xl font-bold">{profile.full_name}</h3>
                    <p className="text-blue-100">{profile.position}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">{profile.department}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Target className="h-4 w-4" />
                        <span className="text-sm">{profile.work_schedule}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-white/20 text-white border-white/30">
                    {profile.employee_id}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Today's Status */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                Today's Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  {todayAttendance ? (
                    <Badge className={`${getStatusColor(todayAttendance.status)} text-white px-3 py-1`}>
                      {getStatusIcon(todayAttendance.status)}
                      {todayAttendance.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="px-3 py-1">
                      <Clock className="h-3 w-3 mr-1" />
                      NOT CHECKED IN
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {todayAttendance ? 
                      calculateWorkHours(todayAttendance.check_in, todayAttendance.check_out, todayAttendance.total_break_minutes) : 
                      '0h 0m'
                    }
                  </div>
                  <p className="text-xs text-gray-500">Work Hours</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Attendance */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                Monthly Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {monthlySummary ? `${monthlySummary.attendance_percentage}%` : 'N/A'}
                  </div>
                  <p className="text-xs text-gray-500">Attendance Rate</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-600">
                    {monthlySummary ? monthlySummary.present_days : 0}
                  </div>
                  <p className="text-xs text-gray-500">Days Present</p>
                </div>
              </div>
              {monthlySummary && (
                <Progress value={monthlySummary.attendance_percentage} className="mt-3" />
              )}
            </CardContent>
          </Card>

          {/* Overtime Hours */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Timer className="h-4 w-4 mr-2 text-purple-600" />
                Overtime Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {monthlySummary ? monthlySummary.total_overtime_hours.toFixed(1) : '0.0'}
                  </div>
                  <p className="text-xs text-gray-500">This Month</p>
                </div>
                <div className="text-right">
                  <Award className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Leaves */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <FileText className="h-4 w-4 mr-2 text-orange-600" />
                Pending Leaves
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {pendingLeaves.length}
                  </div>
                  <p className="text-xs text-gray-500">Awaiting Approval</p>
                </div>
                <div className="text-right">
                  {pendingLeaves.length > 0 ? (
                    <AlertCircle className="h-8 w-8 text-orange-600" />
                  ) : (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Quick Actions</CardTitle>
            <CardDescription>
              Manage your attendance for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {/* Show Check In only if no attendance yet today */}
              {!todayAttendance && (
                <Button 
                  onClick={handleCheckIn} 
                  disabled={actionLoading}
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8"
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  )}
                  Check In
                </Button>
              )}
              
              {isCheckedIn && !isOnBreak && (
                <Button 
                  onClick={handleBreakStart} 
                  disabled={actionLoading}
                  variant="outline"
                  size="lg"
                  className="border-2 px-8"
                >
                  <Coffee className="h-5 w-5 mr-2" />
                  Start Break
                </Button>
              )}
              
              {isOnBreak && (
                <Button 
                  onClick={handleBreakEnd} 
                  disabled={actionLoading}
                  variant="outline"
                  size="lg"
                  className="border-2 px-8"
                >
                  <Coffee className="h-5 w-5 mr-2" />
                  End Break
                </Button>
              )}
              
              {isCheckedIn && (
                <Button 
                  onClick={handleCheckOut} 
                  disabled={actionLoading}
                  variant="outline"
                  size="lg"
                  className="border-2 px-8"
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                  ) : (
                    <LogOut className="h-5 w-5 mr-2" />
                  )}
                  Check Out
                </Button>
              )}
              
              {(isCheckedIn || isOnBreak) && (
                <Badge variant="secondary" className="px-4 py-2 text-sm">
                  <Activity className="h-4 w-4 mr-1" />
                  {isOnBreak ? 'On Break' : 'Currently Working'}
                </Badge>
              )}

              {/* After checkout, indicate completion */}
              {todayAttendance && !isCheckedIn && (
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="px-4 py-2 text-sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Attendance completed for today
                  </Badge>
                  {canUndoCheckout() && (
                    <Button
                      onClick={handleUndoCheckout}
                      disabled={actionLoading}
                      variant="outline"
                      size="sm"
                      className="border-2"
                    >
                      Undo Checkout
                    </Button>
                  )}
                </div>
              )}
            </div>
            {actionMessage && (
              <div className="mt-4 text-sm text-gray-700">{actionMessage}</div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Information Tabs */}
        <Tabs defaultValue="recent" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
            <TabsTrigger value="leaves">Leave Requests</TabsTrigger>
            <TabsTrigger value="summary">Monthly Summary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Recent Attendance
                </CardTitle>
                <CardDescription>
                  Your attendance records for the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAttendance.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No attendance records found</p>
                    </div>
                  ) : (
                    recentAttendance.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <Badge className={`${getStatusColor(record.status)} text-white`}>
                            {getStatusIcon(record.status)}
                            {record.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <div>
                            <p className="font-medium text-gray-900">
                              {new Date(record.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                            <p className="text-sm text-gray-600">
                              In: {formatTime(record.check_in)}
                              {record.check_out && ` | Out: ${formatTime(record.check_out)}`}
                              {record.total_break_minutes > 0 && ` | Break: ${record.total_break_minutes}m`}
                            </p>
                            {record.work_mode !== 'office' && (
                              <p className="text-xs text-gray-500 flex items-center mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                {record.work_mode}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {calculateWorkHours(record.check_in, record.check_out, record.total_break_minutes)}
                          </p>
                          <p className="text-xs text-gray-500">Total Hours</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="leaves">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Leave Requests
                </CardTitle>
                <CardDescription>
                  Your leave requests and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingLeaves.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No pending leave requests</p>
                    </div>
                  ) : (
                    pendingLeaves.map((leave) => (
                      <div key={leave.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <Badge variant="outline" className="px-3 py-1">
                            {leave.leave_type.toUpperCase()}
                          </Badge>
                          <div>
                            <p className="font-medium text-gray-900">
                              {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              {leave.total_days} day(s) • {leave.reason || 'No reason provided'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="px-3 py-1">
                            {leave.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="summary">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Monthly Summary
                </CardTitle>
                <CardDescription>
                  Your attendance statistics for this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                {monthlySummary ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">{monthlySummary.present_days}</div>
                      <p className="text-sm text-gray-600 mt-1">Present Days</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-3xl font-bold text-red-600">{monthlySummary.absent_days}</div>
                      <p className="text-sm text-gray-600 mt-1">Absent Days</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">{monthlySummary.total_work_hours.toFixed(1)}</div>
                      <p className="text-sm text-gray-600 mt-1">Total Hours</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl font-bold text-purple-600">{monthlySummary.total_overtime_hours.toFixed(1)}</div>
                      <p className="text-sm text-gray-600 mt-1">Overtime Hours</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No monthly summary available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}