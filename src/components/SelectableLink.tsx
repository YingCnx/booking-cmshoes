'use client'
import Link from 'next/link'
import { useState, type ReactNode } from 'react'

type Props = {
  href: string
  children: ReactNode
  className?: string
  prefetch?: boolean
}

export function SelectableLink({ href, children, className = '', prefetch = true }: Props) {
  const [pressed, setPressed] = useState(false)

  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={`${className} block transition-all duration-150 ${
        pressed ? 'scale-[0.98] opacity-75' : 'scale-100 opacity-100'
      }`}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
    >
      {children}
    </Link>
  )
}
