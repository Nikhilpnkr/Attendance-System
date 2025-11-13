"use client"

import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        'animate-pulse rounded-md bg-gray-100 dark:bg-gray-800', 
        className
      )} 
      {...props} 
    />
  )
}
