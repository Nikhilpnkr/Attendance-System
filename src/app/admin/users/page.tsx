"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import { SectionCard } from '@/components/ui/section-card'
import { FormField } from '@/components/ui/form-field'
import { useToast } from '@/hooks/use-toast'

export default function AdminUsersPage() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('assistant')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.replace('/login')
          return
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        if (profile?.role !== 'admin') {
          router.replace('/')
          return
        }
      } catch (e) {
        // swallow
        router.replace('/')
      } finally {
        setChecking(false)
      }
    }
    checkAdmin()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: fullName, role }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to create user')
      }

      setMessage('User created successfully')
      toast({ title: 'User created', description: `${email} has been invited` })
      setEmail('')
      setFullName('')
      setRole('assistant')
    } catch (err: any) {
      setError(err?.message || 'Unexpected error')
      toast({ title: 'Failed to create user', description: err?.message || 'Unexpected error', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    checking ? (
      <div className="p-6">Checking permissions...</div>
    ) : (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader title="Create User" description="Invite a user by email and assign a role" />
      <SectionCard title="New User" description="Enter details and submit to create the account">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Email" required>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="user@example.com"
            />
          </FormField>
          <FormField label="Full Name">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="John Doe"
            />
          </FormField>
          <FormField label="Role" required>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="assistant">Assistant</option>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </FormField>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </form>
        {message && <p className="mt-4 text-green-700">{message}</p>}
        {error && <p className="mt-4 text-red-700">{error}</p>}
        <p className="mt-6 text-sm text-muted-foreground">
          Note: Only admins can access this page and create users.
        </p>
      </SectionCard>
    </div>
    )
  )
}
