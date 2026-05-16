# Phase 1: ย้าย cm_shoes_care → Supabase

## ก่อนเริ่ม
- มีไฟล์ dump: `20250501.sql` (pg_dump custom format, pg17)
- สร้าง Supabase project ใหม่: `cm-shoes-care`
  - หรือใช้ project เดิม แล้วแยก schema (ไม่แนะนำ — ซับซ้อน)

## Step 1: แปลง dump เป็น plain SQL

ในเครื่อง Windows ที่มี PostgreSQL 17:

```bash
# เปิด Command Prompt / PowerShell ไปที่โฟลเดอร์ที่มี 20250501.sql
pg_restore --no-owner --no-privileges --no-comments -f cm_shoes_care_plain.sql 20250501.sql
```

ถ้าไม่มี PG17 client → download ที่:
https://www.postgresql.org/download/windows/

## Step 2: แก้ไข dump ก่อน import

เปิด `cm_shoes_care_plain.sql` แล้วลบ:

1. **บรรทัด CREATE DATABASE** (Supabase สร้างให้แล้ว)
   ```
   CREATE DATABASE cm_shoes_care WITH TEMPLATE = ...
   ```

2. **GRANT ALL ON DATABASE** (ไม่มี admin role)
   ```
   GRANT ALL ON DATABASE cm_shoes_care TO admin;
   ```

3. **GRANT statements ทั้งหมดที่ระบุ user `admin`**
   ```
   GRANT ALL ON TABLE public.xxx TO admin;
   GRANT ... TO admin;
   ```
   
   ใช้ find & replace:
   - Find: `GRANT.*TO admin;`
   - Replace: (empty)
   - Use regex: ✓

4. **`SET ROLE postgres;` statements**

## Step 3: Import เข้า Supabase

วิธีที่ 1 — ผ่าน Supabase Dashboard (ง่ายที่สุด):
1. Supabase Dashboard → SQL Editor → New query
2. Paste ทั้งหมด → Run
3. รอจนเสร็จ (อาจใช้เวลานานหน่อยถ้ามีข้อมูลเยอะ)

วิธีที่ 2 — ผ่าน psql:
```bash
psql -h db.xxxxx.supabase.co -U postgres -d postgres -f cm_shoes_care_plain.sql
# กรอก password
```

## Step 4: ทดสอบว่าข้อมูลขึ้นครบ

```sql
SELECT 
  schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  (SELECT count(*) FROM pg_stat_user_tables WHERE relname = tablename) as has_stats
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ดูจำนวนแถวแต่ละตาราง
SELECT 'admins' as t, count(*) FROM admins UNION ALL
SELECT 'appointments', count(*) FROM appointments UNION ALL
SELECT 'branches', count(*) FROM branches UNION ALL
SELECT 'customers', count(*) FROM customers UNION ALL
SELECT 'employees', count(*) FROM employees UNION ALL
SELECT 'queue', count(*) FROM queue UNION ALL
SELECT 'services', count(*) FROM services;
```

## Step 5: รัน migration ปรับ schema สำหรับ LINE

หลังจากข้อมูลครบแล้ว — รัน migration นี้ใน SQL Editor:
