
'use client'

import { useState, useTransition } from 'react'

type Props = {
  displayName: string
}

export function LinkPhoneForm({
  displayName,
}: Props) {
  const [phone, setPhone] =
    useState('')

  const [pending, startTransition] =
    useTransition()

  const [error, setError] =
    useState('')

  const [showConfirm, setShowConfirm] =
    useState(false)

  function handlePhoneChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setPhone(
      e.target.value
        .replace(/\D/g, '')
        .slice(0, 10)
    )
  }

  function submit(
    e: React.FormEvent
  ) {
    e.preventDefault()

    if (!/^\d{10}$/.test(phone)) {
      setError('เบอร์โทรต้อง 10 หลัก')
      return
    }

    setError('')
    setShowConfirm(true)
  }

  function confirmLink() {
    startTransition(async () => {
      try {
        const res = await fetch(
          '/api/customer/link',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              phone,
              displayName,
            }),
          }
        )

        const data = await res.json()

        if (!res.ok) {
          setError(
            data.error ??
              'ไม่สามารถผูกบัญชีได้'
          )

          setShowConfirm(false)
          return
        }

        // สำเร็จ
        window.location.reload()
      } catch {
        setError(
          'เกิดข้อผิดพลาด กรุณาลองใหม่'
        )

        setShowConfirm(false)
      }
    })
  }

  return (
    <>
      <form
        onSubmit={submit}
        className="
          bg-white
          rounded-3xl
          border border-gray-100
          px-5 py-5
          shadow-sm
          space-y-4
        "
      >
        <div>
          <label
            className="
              block
              text-sm
              font-medium
              text-gray-900
              mb-2
            "
          >
            เบอร์โทรศัพท์{' '}
            <span className="text-red-500">
              *
            </span>
          </label>

          <input
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="0812345678"
            inputMode="numeric"
            maxLength={10}
            disabled={pending}
            className="
              w-full
              rounded-2xl
              border border-gray-200
              bg-white
              px-4 py-4
              text-base
              text-gray-900
              placeholder:text-gray-400
              focus:border-black
              focus:outline-none
              disabled:opacity-50
            "
          />

          {phone.length > 0 &&
            phone.length < 10 && (
              <p
                className="
                  mt-1.5
                  text-xs
                  text-amber-600
                "
              >
                อีก{' '}
                {10 - phone.length}{' '}
                หลัก
              </p>
            )}
        </div>

        {error && (
          <p
            className="
              text-sm
              text-red-600
              bg-red-50
              border border-red-200
              rounded-xl
              px-4 py-3
            "
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={
            pending ||
            phone.length !== 10
          }
          className="
            w-full
            rounded-2xl
            bg-black
            py-4
            text-base
            font-bold
            text-white
            transition
            active:scale-[0.99]
            disabled:opacity-50
          "
        >
          {pending
            ? 'กำลังผูกบัญชี...'
            : 'ผูกบัญชี'}
        </button>

        <p
          className="
            text-xs
            text-gray-400
            text-center
          "
        >
          เบอร์โทรนี้ต้องเคยใช้บริการกับร้านมาก่อน
        </p>
      </form>

      {/* Confirm Modal */}
      {showConfirm && (
        <div
          className="
            fixed inset-0 z-50
            bg-black/40
            flex items-center justify-center
            p-5
          "
        >
          <div
            className="
              w-full
              max-w-sm
              rounded-3xl
              bg-white
              p-6
              shadow-xl
              space-y-5
            "
          >
            <div className="space-y-2">
              <h2
                className="
                  text-xl
                  font-bold
                  text-center
                  text-gray-900
                "
              >
                ยืนยันการผูกบัญชี
              </h2>

              <p
                className="
                  text-center
                  text-gray-500
                  text-lg
                "
              >
                {phone}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowConfirm(false)
                }
                className="
                  flex-1
                  rounded-2xl
                  border border-gray-200
                  py-3
                  font-medium
                "
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={confirmLink}
                disabled={pending}
                className="
                  flex-1
                  rounded-2xl
                  bg-black
                  py-3
                  font-medium
                  text-white
                  disabled:opacity-50
                "
              >
                {pending
                  ? 'กำลังดำเนินการ...'
                  : 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
