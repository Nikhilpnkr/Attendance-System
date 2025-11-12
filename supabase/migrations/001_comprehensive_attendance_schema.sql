-- Comprehensive Attendance Management System Schema
-- This schema includes advanced features for detailed attendance tracking, analytics, and reporting

-- 1. Users table (extends auth.users with additional profile information)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  employee_id TEXT UNIQUE,
  department TEXT,
  position TEXT,
  hire_date DATE,
  work_schedule TEXT DEFAULT '9_to_5', -- 9_to_5, flexible, shift_work, remote
  timezone TEXT DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Attendance records with comprehensive tracking
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIMESTAMP WITH TIME ZONE,
  check_out TIMESTAMP WITH TIME ZONE,
  break_start TIMESTAMP WITH TIME ZONE,
  break_end TIMESTAMP WITH TIME ZONE,
  total_break_minutes INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'early_leave', 'half_day', 'holiday', 'sick_leave', 'vacation', 'remote')),
  work_mode TEXT DEFAULT 'office' CHECK (work_mode IN ('office', 'remote', 'hybrid', 'field')),
  location_name TEXT,
  notes TEXT,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 3. Work schedules and shifts
CREATE TABLE IF NOT EXISTS work_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  shift_start TIME NOT NULL,
  shift_end TIME NOT NULL,
  break_duration_minutes INTEGER DEFAULT 60,
  is_working_day BOOLEAN DEFAULT true,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Leave requests and approvals
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('vacation', 'sick', 'personal', 'maternity', 'paternity', 'bereavement', 'unpaid')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Overtime tracking
CREATE TABLE IF NOT EXISTS overtime_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  attendance_id UUID REFERENCES attendance(id) ON DELETE CASCADE,
  regular_hours DECIMAL(5,2) DEFAULT 8.00,
  overtime_hours DECIMAL(5,2) DEFAULT 0.00,
  overtime_type TEXT DEFAULT 'regular' CHECK (overtime_type IN ('regular', 'weekend', 'holiday')),
  rate_multiplier DECIMAL(3,2) DEFAULT 1.50,
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Attendance adjustments and corrections
CREATE TABLE IF NOT EXISTS attendance_adjustments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attendance_id UUID REFERENCES attendance(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('correction', 'manual_entry', 'approval', 'rejection')),
  original_check_in TIMESTAMP WITH TIME ZONE,
  original_check_out TIMESTAMP WITH TIME ZONE,
  new_check_in TIMESTAMP WITH TIME ZONE,
  new_check_out TIMESTAMP WITH TIME ZONE,
  reason TEXT NOT NULL,
  adjusted_by UUID REFERENCES profiles(id),
  adjustment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Department and company structure
CREATE TABLE IF NOT EXISTS departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  manager_id UUID REFERENCES profiles(id),
  parent_department_id UUID REFERENCES departments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Holidays and company events
CREATE TABLE IF NOT EXISTS holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT DEFAULT 'national' CHECK (type IN ('national', 'company', 'religious', 'optional')),
  is_paid BOOLEAN DEFAULT true,
  affects_all BOOLEAN DEFAULT true,
  departments UUID[] DEFAULT '{}', -- Empty array means all departments
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Attendance analytics and summaries
CREATE TABLE IF NOT EXISTS attendance_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_days INTEGER DEFAULT 0,
  present_days INTEGER DEFAULT 0,
  absent_days INTEGER DEFAULT 0,
  late_days INTEGER DEFAULT 0,
  early_leave_days INTEGER DEFAULT 0,
  leave_days INTEGER DEFAULT 0,
  holiday_days INTEGER DEFAULT 0,
  total_work_hours DECIMAL(8,2) DEFAULT 0.00,
  total_overtime_hours DECIMAL(8,2) DEFAULT 0.00,
  attendance_percentage DECIMAL(5,2) DEFAULT 0.00,
  punctuality_percentage DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, period_type, period_start, period_end)
);

-- 10. Device and location tracking
CREATE TABLE IF NOT EXISTS attendance_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  device_name TEXT,
  device_type TEXT CHECK (device_type IN ('mobile', 'desktop', 'tablet', 'kiosk')),
  ip_address INET,
  user_agent TEXT,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  location_address TEXT,
  is_trusted BOOLEAN DEFAULT false,
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Notifications and alerts
CREATE TABLE IF NOT EXISTS attendance_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('check_in_reminder', 'check_out_reminder', 'absence_alert', 'late_arrival', 'early_departure', 'overtime_alert', 'leave_approval')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_email_sent BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Attendance policies and rules
CREATE TABLE IF NOT EXISTS attendance_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  grace_period_minutes INTEGER DEFAULT 15,
  max_late_allowed_per_month INTEGER DEFAULT 3,
  max_early_leave_per_month INTEGER DEFAULT 3,
  min_work_hours_per_day DECIMAL(5,2) DEFAULT 8.00,
  overtime_approval_required BOOLEAN DEFAULT true,
  leave_approval_required BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  applies_to_departments UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Audit log for compliance
CREATE TABLE IF NOT EXISTS attendance_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES profiles(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_date_range ON attendance(date DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department);
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_status ON leave_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_overtime_records_user_date ON overtime_records(user_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_summaries_user_period ON attendance_summaries(user_id, period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON attendance_notifications(user_id, is_read);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtime_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for Attendance
CREATE POLICY "Users can view their own attendance" ON attendance
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attendance" ON attendance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance" ON attendance
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for Work Schedules
CREATE POLICY "Users can view their own work schedule" ON work_schedules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own work schedule" ON work_schedules
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for Leave Requests
CREATE POLICY "Users can view their own leave requests" ON leave_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own leave requests" ON leave_requests
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for Overtime Records
CREATE POLICY "Users can view their own overtime records" ON overtime_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own overtime records" ON overtime_records
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for Attendance Adjustments
CREATE POLICY "Users can view their own attendance adjustments" ON attendance_adjustments
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for Attendance Summaries
CREATE POLICY "Users can view their own attendance summaries" ON attendance_summaries
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for Attendance Devices
CREATE POLICY "Users can view their own devices" ON attendance_devices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own devices" ON attendance_devices
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for Notifications
CREATE POLICY "Users can view their own notifications" ON attendance_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON attendance_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Public access policies for reference tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view departments" ON departments FOR SELECT USING (true);

ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view holidays" ON holidays FOR SELECT USING (true);

ALTER TABLE attendance_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view attendance policies" ON attendance_policies FOR SELECT USING (true);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_schedules_updated_at BEFORE UPDATE ON work_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_overtime_records_updated_at BEFORE UPDATE ON overtime_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_adjustments_updated_at BEFORE UPDATE ON attendance_adjustments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_summaries_updated_at BEFORE UPDATE ON attendance_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_holidays_updated_at BEFORE UPDATE ON holidays
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_policies_updated_at BEFORE UPDATE ON attendance_policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger function for audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO attendance_audit_log (table_name, record_id, action_type, old_values, changed_by, changed_at)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), auth.uid(), NOW());
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO attendance_audit_log (table_name, record_id, action_type, old_values, new_values, changed_by, changed_at)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), auth.uid(), NOW());
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO attendance_audit_log (table_name, record_id, action_type, new_values, changed_by, changed_at)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW), auth.uid(), NOW());
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for important tables
CREATE TRIGGER audit_attendance AFTER INSERT OR UPDATE OR DELETE ON attendance
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_leave_requests AFTER INSERT OR UPDATE OR DELETE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_overtime_records AFTER INSERT OR UPDATE OR DELETE ON overtime_records
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_attendance_adjustments AFTER INSERT OR UPDATE OR DELETE ON attendance_adjustments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Insert default attendance policy
INSERT INTO attendance_policies (name, description, grace_period_minutes, max_late_allowed_per_month, max_early_leave_per_month, min_work_hours_per_day, overtime_approval_required, leave_approval_required)
VALUES ('Default Policy', 'Standard attendance policy for all employees', 15, 3, 3, 8.00, true, true)
ON CONFLICT DO NOTHING;

-- Insert some common holidays (example)
INSERT INTO holidays (name, date, type, is_paid, affects_all)
VALUES 
    ('New Year''s Day', '2024-01-01', 'national', true, true),
    ('Independence Day', '2024-07-04', 'national', true, true),
    ('Christmas Day', '2024-12-25', 'national', true, true)
ON CONFLICT DO NOTHING;