'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Save, ChevronLeft, Shield, Clock, Globe } from 'lucide-react'

interface Profile {
  id: string
  full_name: string
  employee_id: string
  department: string
  position: string
  work_schedule: string
  timezone: string
  phone: string
  address: string
  bio: string
  avatar_url?: string
  hire_date: string
  is_active: boolean
  created_at: string
  updated_at: string
}

const workSchedules = [
  { value: '9_to_5', label: '9 AM - 5 PM' },
  { value: 'flexible', label: 'Flexible Hours' },
  { value: 'shift_work', label: 'Shift Work' },
  { value: 'remote', label: 'Remote Work' }
]

const timezones = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' }
]

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordChanging, setPasswordChanging] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    bio: '',
    work_schedule: '',
    timezone: ''
  })

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setProfile(data)
      setFormData({
        full_name: data?.full_name || '',
        phone: data?.phone || '',
        address: data?.address || '',
        bio: data?.bio || '',
        work_schedule: data?.work_schedule || '9_to_5',
        timezone: data?.timezone || 'UTC'
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user || !profile) return

    setSaving(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          bio: formData.bio,
          work_schedule: formData.work_schedule,
          timezone: formData.timezone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      // Update local state
      setProfile(prev => prev ? { ...prev, ...formData } : null)
      setEditMode(false)
    } catch (error: any) {
      console.error('Error saving profile:', error)
      // In a real app, show error message to user
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!user) return

    setPasswordError(null)
    setPasswordSuccess(null)

    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password do not match.')
      return
    }

    try {
      setPasswordChanging(true)
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      })

      if (error) {
        throw error
      }

      setPasswordSuccess('Password updated successfully.')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordForm(false)
    } catch (error: any) {
      console.error('Error changing password:', error)
      setPasswordError(error?.message || 'Failed to change password. Please try again.')
    } finally {
      setPasswordChanging(false)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading profile...</p>
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
              <h1 className="text-xl font-semibold text-foreground">Profile Settings</h1>
            </div>
            <div className="flex items-center space-x-2">
              {editMode ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setEditMode(false)
                      // Reset form data
                      setFormData({
                        full_name: profile?.full_name || '',
                        phone: profile?.phone || '',
                        address: profile?.address || '',
                        bio: profile?.bio || '',
                        work_schedule: profile?.work_schedule || '9_to_5',
                        timezone: profile?.timezone || 'UTC'
                      })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setEditMode(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {profile && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-lg bg-card">
                <CardHeader className="text-center">
                  <CardTitle className="text-lg">Profile Picture</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="relative inline-block">
                    <Avatar className="h-32 w-32 mx-auto">
                      <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                      <AvatarFallback className="text-3xl bg-blue-100 text-blue-600">
                        {profile.full_name?.charAt(0) || user.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{profile.full_name}</h3>
                    <p className="text-muted-foreground">{profile.position}</p>
                    <Badge variant="outline" className="mt-2">
                      {profile.employee_id}
                    </Badge>
                  </div>
                </CardContent>
                <Separator />
                <CardContent>
                  <div className="space-y-3 text-left">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                    </div>
                    {profile.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{profile.phone}</span>
                      </div>
                    )}
                    {profile.department && (
                      <div className="flex items-center space-x-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{profile.department}</span>
                      </div>
                    )}
                    {profile.address && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{profile.address}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={editMode ? formData.full_name : profile.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        disabled={!editMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employee_id">Employee ID</Label>
                      <Input
                        id="employee_id"
                        value={profile.employee_id}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={editMode ? formData.phone : (profile.phone || '')}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!editMode}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={editMode ? formData.address : (profile.address || '')}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      disabled={!editMode}
                      placeholder="123 Main St, City, State 12345"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={editMode ? formData.bio : (profile.bio || '')}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      disabled={!editMode}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Work Preferences */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Work Preferences
                  </CardTitle>
                  <CardDescription>
                    Configure your work schedule and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="work_schedule">Work Schedule</Label>
                      <Select 
                        value={editMode ? formData.work_schedule : (profile.work_schedule || '9_to_5')} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, work_schedule: value }))}
                        disabled={!editMode}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {workSchedules.map((schedule) => (
                            <SelectItem key={schedule.value} value={schedule.value}>
                              {schedule.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select 
                        value={editMode ? formData.timezone : (profile.timezone || 'UTC')} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                        disabled={!editMode}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timezones.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={profile.department || ''}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position">Position</Label>
                      <Input
                        id="position"
                        value={profile.position || ''}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hire_date">Hire Date</Label>
                      <Input
                        id="hire_date"
                        value={new Date(profile.hire_date).toLocaleDateString()}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <div className="flex items-center space-x-2">
                        <Badge className={profile.is_active ? 'bg-green-500' : 'bg-red-500'}>
                          {profile.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Security */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Account Security
                  </CardTitle>
                  <CardDescription>
                    Manage your account security settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-background/60">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Email Verification</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Verified</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg bg-background/60">
                    <div className="flex items-center space-x-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Enable
                    </Button>
                  </div>

                  <div className="flex flex-col space-y-4 p-4 border rounded-lg bg-background/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">Password</p>
                          <p className="text-sm text-gray-600">Update your account password</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowPasswordForm((prev) => !prev)
                          setPasswordError(null)
                          setPasswordSuccess(null)
                        }}
                      >
                        {showPasswordForm ? 'Cancel' : 'Change Password'}
                      </Button>
                    </div>

                    {showPasswordForm && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="new_password">New Password</Label>
                            <Input
                              id="new_password"
                              type="password"
                              value={passwordForm.newPassword}
                              onChange={(e) =>
                                setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                              }
                              className="border border-gray-400 bg-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="confirm_password">Confirm Password</Label>
                            <Input
                              id="confirm_password"
                              type="password"
                              value={passwordForm.confirmPassword}
                              onChange={(e) =>
                                setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                              }
                              className="border border-gray-400 bg-white"
                            />
                          </div>
                        </div>

                        {passwordError && (
                          <p className="text-sm text-red-600">{passwordError}</p>
                        )}
                        {passwordSuccess && (
                          <p className="text-sm text-green-600">{passwordSuccess}</p>
                        )}

                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={handleChangePassword}
                            disabled={passwordChanging}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {passwordChanging ? 'Updating...' : 'Update Password'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}