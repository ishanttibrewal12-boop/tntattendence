-- Add shift_count to attendance for tracking shifts (1 or 2)
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS shift_count INTEGER DEFAULT 1;

-- Add notes column to staff table
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update attendance_status enum to remove half_day and sunday, keep only what's needed
-- First, let's update the constraint
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_status_check;

-- Update existing records
UPDATE public.attendance SET status = 'absent' WHERE status IN ('half_day', 'sunday', 'holiday');

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_staff_date ON public.attendance(staff_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_advances_staff ON public.advances(staff_id);