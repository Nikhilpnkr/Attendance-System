"use client"

import { Badge } from '@/components/ui/badge'

const map: Record<string, string> = {
  present: 'bg-green-600 text-white',
  late: 'bg-yellow-500 text-white',
  absent: 'bg-red-600 text-white',
  early_leave: 'bg-orange-500 text-white',
  half_day: 'bg-blue-600 text-white',
  holiday: 'bg-teal-600 text-white',
  sick_leave: 'bg-purple-600 text-white',
  vacation: 'bg-cyan-600 text-white',
  remote: 'bg-indigo-600 text-white',
  pending: 'bg-amber-500 text-white',
  approved: 'bg-emerald-600 text-white',
  rejected: 'bg-rose-600 text-white',
}

export function StatusBadge({ value }: { value: string }) {
  const cls = map[value] || 'bg-gray-500 text-white'
  return <Badge className={`${cls} px-3 py-1`}>{value.replace('_', ' ').toUpperCase()}</Badge>
}
