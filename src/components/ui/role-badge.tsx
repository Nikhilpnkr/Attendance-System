"use client"

import { Badge } from '@/components/ui/badge'

const map: Record<string, string> = {
  admin: 'bg-primary text-primary-foreground',
  manager: 'bg-indigo-600 text-white',
  assistant: 'bg-amber-600 text-white',
  employee: 'bg-gray-600 text-white',
}

export function RoleBadge({ value }: { value?: string | null }) {
  const v = (value || 'employee').toLowerCase()
  const cls = map[v] || map.employee
  return <Badge className={`${cls} px-2.5 py-0.5`}>{v}</Badge>
}
