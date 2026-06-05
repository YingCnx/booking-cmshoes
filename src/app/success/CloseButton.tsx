'use client'

declare global {
  interface Window { liff: any }
}

export function CloseButton() {
  function handleClose() {
    // ถ้าอยู่ใน LINE app → ปิดหน้าต่าง
    try {
      if (window.liff?.isInClient?.() && window.liff?.closeWindow) {
        window.liff.closeWindow()
        return
      }
    } catch {}
    // fallback → กลับไปหน้าแรก
    window.location.href = '/service'
  }

  return (
    <button onClick={handleClose}
      className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-2xl text-base font-bold active:scale-[0.98] transition-transform">
      กลับไปหน้าแรก
    </button>
  )
}
