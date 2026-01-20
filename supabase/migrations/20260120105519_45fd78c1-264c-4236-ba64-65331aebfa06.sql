-- Add 'office' to staff_category enum
ALTER TYPE staff_category ADD VALUE IF NOT EXISTS 'office';

-- Add 'not_marked' to attendance_status enum  
ALTER TYPE attendance_status ADD VALUE IF NOT EXISTS 'not_marked';

-- Add address field to staff table if not exists
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS address TEXT;

-- Create app_settings table for PIN lock
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default PIN
INSERT INTO public.app_settings (setting_key, setting_value) 
VALUES ('app_pin', '8465')
ON CONFLICT (setting_key) DO NOTHING;

-- Enable RLS on app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to app_settings for PIN verification
CREATE POLICY "Allow read access for PIN verification" 
ON public.app_settings 
FOR SELECT 
USING (true);