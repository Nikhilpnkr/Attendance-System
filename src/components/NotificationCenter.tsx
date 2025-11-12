'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bell, X, CheckCircle, AlertCircle, Info, Calendar, Clock, Coffee, Users, FileText, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface Notification {
  id: string
  user_id: string
  notification_type: string
  title: string
  message: string
  is_read: boolean
  is_email_sent: boolean
  scheduled_for: string
  sent_at: string
  created_at: string
}

const notificationIcons = {
  check_in_reminder: Clock,
  check_out_reminder: Clock,
  absence_alert: AlertCircle,
  late_arrival: AlertCircle,
  early_departure: AlertCircle,
  overtime_alert: Coffee,
  leave_approval: FileText,
  holiday_reminder: Calendar,
  system_update: Settings,
  team_announcement: Users
}

const notificationColors = {
  check_in_reminder: 'bg-blue-500',
  check_out_reminder: 'bg-blue-500',
  absence_alert: 'bg-red-500',
  late_arrival: 'bg-yellow-500',
  early_departure: 'bg-orange-500',
  overtime_alert: 'bg-purple-500',
  leave_approval: 'bg-green-500',
  holiday_reminder: 'bg-pink-500',
  system_update: 'bg-gray-500',
  team_announcement: 'bg-indigo-500'
}

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationPanel({ isOpen, onClose }: NotificationCenterProps) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAsRead, setMarkingAsRead] = useState(false)

  useEffect(() => {
    if (user && isOpen) {
      fetchNotifications()
    }
  }, [user, isOpen])

  const fetchNotifications = async () => {
    if (!user) return

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error } = await supabase
        .from('attendance_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setNotifications(data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    setMarkingAsRead(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { error } = await supabase
        .from('attendance_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    } finally {
      setMarkingAsRead(false)
    }
  }

  const markAllAsRead = async () => {
    setMarkingAsRead(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)

      if (unreadIds.length === 0) return

      const { error } = await supabase
        .from('attendance_notifications')
        .update({ is_read: true })
        .in('id', unreadIds)

      if (error) throw error

      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      )
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    } finally {
      setMarkingAsRead(false)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { error } = await supabase
        .from('attendance_notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end pt-16">
      <div className="bg-white w-full max-w-md h-full shadow-xl border-l">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={markAllAsRead}
                disabled={markingAsRead}
              >
                Mark all as read
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No notifications</p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.notification_type as keyof typeof notificationIcons] || Bell
                const color = notificationColors[notification.notification_type as keyof typeof notificationColors] || 'bg-gray-500'
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-all cursor-pointer hover:bg-gray-50 ${
                      !notification.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white'
                    }`}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${color} text-white flex-shrink-0`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-gray-900 text-sm">
                            {notification.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatTime(notification.created_at)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {notification.notification_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (user) {
      fetchUnreadCount()
    }
  }, [user])

  const fetchUnreadCount = async () => {
    if (!user) return

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error } = await supabase
        .from('attendance_notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error

      setUnreadCount(data?.length || 0)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(true)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      <NotificationPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}