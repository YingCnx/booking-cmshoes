'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

export function BeforeAfterSlider({
  beforeSrc = '/before.jpg',
  afterSrc  = '/after.jpg',
}: {
  beforeSrc?: string
  afterSrc?: string
}) {
  const [position, setPosition] = useState(50)
  const [width, setWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width)
    })
    ro.observe(containerRef.current)
    setWidth(containerRef.current.offsetWidth)
    return () => ro.disconnect()
  }, [])

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    setPosition((x / rect.width) * 100)
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden select-none cursor-col-resize bg-gray-100"
      onMouseDown={() => { isDragging.current = true }}
      onMouseMove={e => { if (isDragging.current) updatePosition(e.clientX) }}
      onMouseUp={() => { isDragging.current = false }}
      onMouseLeave={() => { isDragging.current = false }}
      onTouchStart={() => { isDragging.current = true }}
      onTouchMove={e => updatePosition(e.touches[0].clientX)}
      onTouchEnd={() => { isDragging.current = false }}
    >
      {/* หลังซัก — เต็ม container */}
      <img
        src={afterSrc} alt="หลังซัก"
        className="absolute inset-0 w-full h-full object-cover object-top"
        draggable={false}
      />

      {/* ก่อนซัก — clip ทางซ้ายตาม position */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <img
          src={beforeSrc} alt="ก่อนซัก"
          className="absolute top-0 left-0 h-full object-cover object-top"
          style={{ width: width || '100%' }}
          draggable={false}
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_8px_rgba(0,0,0,0.4)]"
        style={{ left: `calc(${position}% - 1px)` }}
      >
        {/* Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3L3 8l5 5"/><path d="M16 3l5 5-5 5"/>
            <line x1="3" y1="8" x2="21" y2="8"/>
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
        ก่อนซัก
      </div>
      <div className="absolute top-3 right-3 bg-[#2ABFAB]/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
        หลังซัก
      </div>
    </div>
  )
}
