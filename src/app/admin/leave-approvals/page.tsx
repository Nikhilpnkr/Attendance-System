'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { SectionCard } from '@/components/ui/section-card'
import { Input } from '@/components/ui/input'
import { 
  Table, 
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell 
} from '@/components/ui/table'
import { BackButton } from '@/components/admin/BackButton'

export default function LeaveApprovalsPage() {
  return (
    <div className="p-6">
      <BackButton href="/admin" label="Back to Admin" action="push" />
      <PageHeader title="Leave Approvals" description="Approve or reject employee leave requests" />

      <SectionCard>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Input
            placeholder="Search user, type, or reason..."
            value=""
            onChange={(e) => {}}
            className="max-w-sm"
          />
          <select
            value=""
            onChange={(e) => {}}
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
              {/* Table rows will be rendered here */}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  )
}
