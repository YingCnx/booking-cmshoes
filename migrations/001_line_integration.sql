-- ============================================
-- Migration: เพิ่ม LINE integration ใน cm_shoes_care
-- รันหลังจาก import dump เสร็จแล้ว
-- ============================================

-- 1. เพิ่ม line_user_id ใน customers
ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS line_user_id TEXT,
  ADD COLUMN IF NOT EXISTS line_display_name TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_customers_line_user_id 
  ON customers(line_user_id) 
  WHERE line_user_id IS NOT NULL;

-- 2. เพิ่ม LINE config + booking config ใน branches
ALTER TABLE branches 
  ADD COLUMN IF NOT EXISTS line_channel_id TEXT,
  ADD COLUMN IF NOT EXISTS line_channel_secret TEXT,
  ADD COLUMN IF NOT EXISTS line_access_token TEXT,
  ADD COLUMN IF NOT EXISTS line_liff_id TEXT,
  ADD COLUMN IF NOT EXISTS line_admin_group_id TEXT,
  ADD COLUMN IF NOT EXISTS open_time TIME DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS close_time TIME DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS slot_interval_minutes INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS max_parallel_bookings INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS holiday_dates DATE[] DEFAULT '{}';

-- 3. เพิ่ม duration_minutes + is_active ใน services
ALTER TABLE services 
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 4. ปรับ appointments — เพิ่ม service_id, end_time, updated_at
ALTER TABLE appointments 
  ADD COLUMN IF NOT EXISTS service_id INTEGER REFERENCES services(id),
  ADD COLUMN IF NOT EXISTS end_time TIME,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 5. Indexes สำหรับ performance
CREATE INDEX IF NOT EXISTS idx_appointments_date_branch 
  ON appointments(appointment_date, branch_id);

CREATE INDEX IF NOT EXISTS idx_appointments_status 
  ON appointments(status);

CREATE INDEX IF NOT EXISTS idx_appointments_customer 
  ON appointments(customer_id);

-- 6. Trigger auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at 
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at 
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. (Optional) Comment เอกสาร
COMMENT ON COLUMN customers.line_user_id IS 'LINE userId — null = customer ไม่ได้มาจาก LINE';
COMMENT ON COLUMN appointments.appointment_type IS 'walk-in | online | line_booking';
COMMENT ON COLUMN appointments.status IS 'รอดำเนินการ (default) | ยืนยันแล้ว | เสร็จสิ้น | ยกเลิก';

-- 8. ตั้งค่าสาขาแรก (หลังจาก import เสร็จ)
-- UPDATE branches SET 
--   line_channel_id = '...',
--   line_channel_secret = '...',
--   line_access_token = '...',
--   line_liff_id = '...',
--   line_admin_group_id = '...',
--   open_time = '09:00',
--   close_time = '20:00',
--   slot_interval_minutes = 60,
--   max_parallel_bookings = 3
-- WHERE id = 1;
