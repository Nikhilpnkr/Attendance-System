"use client"

import { ReactNode } from 'react'

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onOpenChange,
  children,
}: {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  children?: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} />
      <div className="relative z-[101] w-full max-w-sm rounded-lg bg-card text-card-foreground shadow-lg p-5">
        <h3 className="text-base font-semibold">{title}</h3>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        {children && <div className="mt-3">{children}</div>}
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            className="px-3 py-2 rounded border"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </button>
          <button
            className="px-3 py-2 rounded bg-primary text-primary-foreground"
            onClick={() => { onOpenChange(false); onConfirm() }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
