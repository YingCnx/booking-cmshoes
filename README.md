# Booking Shoecare

Mini app สำหรับร้านซักรองเท้า (ลูกค้าจองคิวผ่าน LINE)
- เชื่อมกับฐานข้อมูล `cm_shoes_care` (Supabase Project B)
- INSERT ตรงๆ ไปที่ `appointments`, `customers`

## Stack
- Next.js 16 + Turbopack
- Supabase (Project ที่มี cm_shoes_care DB)
- LINE LIFF + Messaging API
- Tailwind CSS v4

## Setup

### 1. ติดตั้ง dependencies
```bash
npm install
```

### 2. รัน migration ใน Supabase
- ดูใน `migrations/001_line_integration.sql`
- รันใน Supabase SQL Editor หลังจาก import dump เสร็จแล้ว

### 3. ตั้งค่า branch
```sql
UPDATE branches SET 
  line_channel_id = '...',
  line_channel_secret = '...',
  line_access_token = '...',
  line_liff_id = '...',
  line_admin_group_id = '...',
  open_time = '09:00',
  close_time = '20:00',
  slot_interval_minutes = 60,
  max_parallel_bookings = 3
WHERE id = 1;
```

### 4. ตั้งค่า ENV
ดูตัวอย่างใน `.env.example`

### 5. Deploy
```bash
vercel
```

### 6. ตั้งค่า webhook ใน LINE Developers Console
URL: `https://your-domain.vercel.app/api/line/webhook/[branchId]`

## Customer Flow
```
LINE Rich Menu → /liff → /service → เลือกบริการ
                                  ↓
                          /service/[id] → เลือกวัน/เวลา
                                  ↓
                          /confirm → กรอก ชื่อ/เบอร์/สถานที่/จำนวน
                                  ↓
                          INSERT appointments (status='รอดำเนินการ')
                                  ↓
                          แจ้ง LINE Admin Group + ลูกค้า
```

## Admin Flow
```
Admin กดปุ่ม Dashboard ใน Flex (จากกลุ่ม LINE)
  ↓
/admin-login?groupId=Cxxx → LIFF → verify group membership
  ↓
/admin → ดูรายการรอยืนยัน + คิววันนี้
  ↓
/admin/appointments/[id] → ยืนยัน/ยกเลิก/เสร็จสิ้น
  ↓
LINE แจ้งลูกค้าอัตโนมัติ
```
