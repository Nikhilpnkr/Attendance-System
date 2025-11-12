'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { BarChart3, TrendingUp, TrendingDown, Clock, Users, Calendar, Target, Award, Coffee, AlertCircle, Download, ChevronLeft } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts'

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

interface MonthlyData {
  month: string
  attendance_rate: number
  punctuality_rate: number
  total_hours: number
  overtime_hours: number
  present_days: number
  absent_days: number
}

interface StatusData {
  name: string
  value: number
  color: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [summaries, setSummaries] = useState<AttendanceSummary[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState('monthly')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchAnalyticsData()
    }
  }, [user])

  const fetchAnalyticsData = async () => {
    if (!user) return

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      // Fetch attendance summaries for the last 12 months
      const twelveMonthsAgo = new Date()
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

      const { data: summariesData, error: summariesError } = await supabase
        .from('attendance_summaries')
        .select('*')
        .eq('user_id', user.id)
        .eq('period_type', 'monthly')
        .gte('period_start', twelveMonthsAgo.toISOString().split('T')[0])
        .order('period_start', { ascending: false })

      if (summariesError) throw summariesError

      setSummaries(summariesData || [])

      // Process data for charts
      const processedData = (summariesData || []).map(summary => ({
        month: new Date(summary.period_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        attendance_rate: summary.attendance_percentage,
        punctuality_rate: summary.punctuality_percentage,
        total_hours: summary.total_work_hours,
        overtime_hours: summary.total_overtime_hours,
        present_days: summary.present_days,
        absent_days: summary.absent_days
      })).reverse()

      setMonthlyData(processedData)
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusDistribution = (): StatusData[] => {
    if (summaries.length === 0) return []

    const latestSummary = summaries[0]
    return [
      { name: 'Present', value: latestSummary.present_days, color: '#10B981' },
      { name: 'Absent', value: latestSummary.absent_days, color: '#EF4444' },
      { name: 'Late', value: latestSummary.late_days, color: '#F59E0B' },
      { name: 'Early Leave', value: latestSummary.early_leave_days, color: '#F97316' },
      { name: 'Leave', value: latestSummary.leave_days, color: '#8B5CF6' },
      { name: 'Holiday', value: latestSummary.holiday_days, color: '#06B6D4' }
    ]
  }

  const getCurrentMonthStats = () => {
    if (summaries.length === 0) return null
    return summaries[0]
  }

  const getYearlyStats = () => {
    if (summaries.length === 0) return null

    return summaries.reduce((acc, summary) => ({
      total_work_hours: acc.total_work_hours + summary.total_work_hours,
      total_overtime_hours: acc.total_overtime_hours + summary.total_overtime_hours,
      present_days: acc.present_days + summary.present_days,
      absent_days: acc.absent_days + summary.absent_days,
      attendance_percentage: (acc.attendance_percentage + summary.attendance_percentage) / (summaries.length)
    }), {
      total_work_hours: 0,
      total_overtime_hours: 0,
      present_days: 0,
      absent_days: 0,
      attendance_percentage: 0
    })
  }

  const exportReport = () => {
    const currentStats = getCurrentMonthStats()
    const yearlyStats = getYearlyStats()

    const reportData = [
      ['Analytics Report', '', ''],
      ['Generated', new Date().toLocaleString()],
      ['User', user?.email || 'N/A'],
      [''],
      ['Monthly Statistics', '', ''],
      ['Period', currentStats ? `${currentStats.period_start} to ${currentStats.period_end}` : 'N/A'],
      ['Attendance Rate', currentStats ? `${currentStats.attendance_percentage}%` : 'N/A'],
      ['Punctuality Rate', currentStats ? `${currentStats.punctuality_percentage}%` : 'N/A'],
      ['Total Work Hours', currentStats ? currentStats.total_work_hours.toFixed(1) : 'N/A'],
      ['Overtime Hours', currentStats ? currentStats.total_overtime_hours.toFixed(1) : 'N/A'],
      ['Present Days', currentStats ? currentStats.present_days : 'N/A'],
      ['Absent Days', currentStats ? currentStats.absent_days : 'N/A'],
      [''],
      ['Yearly Statistics', '', ''],
      ['Total Work Hours', yearlyStats ? yearlyStats.total_work_hours.toFixed(1) : 'N/A'],
      ['Total Overtime Hours', yearlyStats ? yearlyStats.total_overtime_hours.toFixed(1) : 'N/A'],
      ['Average Attendance Rate', yearlyStats ? `${yearlyStats.attendance_percentage.toFixed(1)}%` : 'N/A']
    ]

    const csvContent = reportData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance_analytics_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
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

  const currentStats = getCurrentMonthStats()
  const yearlyStats = getYearlyStats()
  const statusDistribution = getStatusDistribution()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => window.history.back()}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Analytics & Reports</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly View</SelectItem>
                  <SelectItem value="quarterly">Quarterly View</SelectItem>
                  <SelectItem value="yearly">Yearly View</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportReport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading analytics data...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                    Attendance Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {currentStats ? `${currentStats.attendance_percentage}%` : 'N/A'}
                  </div>
                  <p className="text-xs text-gray-500">This Month</p>
                  {currentStats && (
                    <Progress value={currentStats.attendance_percentage} className="mt-3" />
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-blue-600" />
                    Work Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {currentStats ? currentStats.total_work_hours.toFixed(1) : 'N/A'}
                  </div>
                  <p className="text-xs text-gray-500">This Month</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <Coffee className="h-4 w-4 mr-2 text-purple-600" />
                    Overtime
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {currentStats ? currentStats.total_overtime_hours.toFixed(1) : 'N/A'}
                  </div>
                  <p className="text-xs text-gray-500">This Month</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <Target className="h-4 w-4 mr-2 text-orange-600" />
                    Punctuality
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {currentStats ? `${currentStats.punctuality_percentage}%` : 'N/A'}
                  </div>
                  <p className="text-xs text-gray-500">This Month</p>
                  {currentStats && (
                    <Progress value={currentStats.punctuality_percentage} className="mt-3" />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="trends" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="trends">Trends</TabsTrigger>
                <TabsTrigger value="distribution">Distribution</TabsTrigger>
                <TabsTrigger value="comparison">Comparison</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>
              
              <TabsContent value="trends">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle>Attendance Rate Trend</CardTitle>
                      <CardDescription>Monthly attendance percentage over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="attendance_rate" 
                            stroke="#10B981" 
                            strokeWidth={2}
                            dot={{ fill: '#10B981' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle>Work Hours Trend</CardTitle>
                      <CardDescription>Monthly work hours including overtime</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Area 
                            type="monotone" 
                            dataKey="total_hours" 
                            stackId="1"
                            stroke="#3B82F6" 
                            fill="#3B82F6" 
                            fillOpacity={0.6}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="overtime_hours" 
                            stackId="1"
                            stroke="#8B5CF6" 
                            fill="#8B5CF6" 
                            fillOpacity={0.6}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="distribution">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle>Status Distribution</CardTitle>
                      <CardDescription>Breakdown of attendance status this month</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={statusDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {statusDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle>Monthly Comparison</CardTitle>
                      <CardDescription>Present vs Absent days comparison</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyData.slice(-6)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="present_days" fill="#10B981" />
                          <Bar dataKey="absent_days" fill="#EF4444" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="comparison">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>Compare different attendance metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={monthlyData.slice(-6)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="attendance_rate" fill="#10B981" name="Attendance %" />
                        <Bar dataKey="punctuality_rate" fill="#F59E0B" name="Punctuality %" />
                        <Bar dataKey="overtime_hours" fill="#8B5CF6" name="Overtime Hours" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="summary">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2" />
                        Monthly Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {currentStats ? (
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Period:</span>
                            <span className="font-medium">
                              {new Date(currentStats.period_start).toLocaleDateString()} - {new Date(currentStats.period_end).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Present Days:</span>
                            <span className="font-medium text-green-600">{currentStats.present_days}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Absent Days:</span>
                            <span className="font-medium text-red-600">{currentStats.absent_days}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Late Days:</span>
                            <span className="font-medium text-yellow-600">{currentStats.late_days}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Leave Days:</span>
                            <span className="font-medium text-blue-600">{currentStats.leave_days}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500">No data available</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Award className="h-5 w-5 mr-2" />
                        Yearly Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {yearlyStats ? (
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Work Hours:</span>
                            <span className="font-medium">{yearlyStats.total_work_hours.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Overtime:</span>
                            <span className="font-medium">{yearlyStats.total_overtime_hours.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Present Days:</span>
                            <span className="font-medium text-green-600">{yearlyStats.present_days}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Absent Days:</span>
                            <span className="font-medium text-red-600">{yearlyStats.absent_days}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Average Attendance:</span>
                            <span className="font-medium">{yearlyStats.attendance_percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500">No data available</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  )
}