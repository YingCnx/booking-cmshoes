'use client'

import { useRef, useState, useCallback } from 'react'

export function BeforeAfterSlider({
  beforeSrc = '/before.jpg',
  afterSrc  = '/after.jpg',
}: {
  beforeSrc?: string
  afterSrc?: string
}) {
  const [position, setPosition] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    setPosition((x / rect.width) * 100)
  }, [])

  const onMouseDown = () => { isDragging.current = true }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    updatePosition(e.clientX)
  }
  const onMouseUp = () => { isDragging.current = false }

  const onTouchMove = (e: React.TouchEvent) => {
    updatePosition(e.touches[0].clientX)
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden select-none cursor-col-resize"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchMove={onTouchMove}
    >
      {/* หลังซัก (ด้านหลัง) */}
      <img src={afterSrc} alt="หลังซัก"
        className="absolute inset-0 w-full h-full object-cover" />

      {/* ก่อนซัก (clip ตามตำแหน่ง) */}
      <div className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}>
        <img src={beforeSrc} alt="ก่อนซัก"
          className="absolute inset-0 h-full object-cover"
          style={{ width: containerRef.current?.offsetWidth ?? 400 }} />
      </div>

      {/* Divider */}
      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
        style={{ left: `${position}%` }}>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white shadow-xl flex items-center justify-center">
          <span className="text-gray-600 text-sm font-bold">⇔</span>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
        ก่อนซัก
      </div>
      <div className="absolute top-3 right-3 bg-[#2ABFAB]/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
        หลังซัก
      </div>
    </div>
  )
}
