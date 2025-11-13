"use client"

import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type BackButtonProps = {
  href?: string
  label: string
  className?: string
  action?: 'push' | 'back'
}

export function BackButton({ 
  href = '', 
  label, 
  className = '',
  action = 'push'
}: BackButtonProps) {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)
  
  const handleClick = () => {
    setIsNavigating(true)
    action === 'back' ? router.back() : router.push(href)
  }
  
  return (
    <Button 
      variant="ghost" 
      onClick={handleClick}
      className={`mb-4 ${className}`}
      disabled={isNavigating}
      aria-label={`Go back to ${label}`}
    >
      <ChevronLeft className={`mr-2 h-4 w-4 ${isNavigating ? 'animate-pulse' : ''}`} />
      {isNavigating ? 'Loading...' : label}
    </Button>
  )
}
