-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('manager', 'mlt_admin', 'petroleum_admin', 'crusher_admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS policy: Users can view their own role
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS policy: Only managers can view all roles
CREATE POLICY "Managers can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'manager'));

-- Create app_users table for managing login credentials (without using auth.users directly)
CREATE TABLE public.app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role app_role NOT NULL,
    category TEXT, -- 'mlt', 'petroleum', 'crusher', 'office', or NULL for manager
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on app_users
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read app_users for login (password verification happens in code)
CREATE POLICY "Allow reading app_users for login"
ON public.app_users
FOR SELECT
USING (true);

-- Only managers can insert/update/delete app_users
CREATE POLICY "Managers can manage app_users"
ON public.app_users
FOR ALL
USING (true);

-- Insert the 4 default users
INSERT INTO public.app_users (username, password_hash, full_name, role, category) VALUES
('Abhay1234', 'Tibrewal8465', 'Abhay Jalan', 'manager', NULL),
('Rishab1234', '4576', 'Rishab', 'mlt_admin', 'mlt'),
('santosh1234', '4590', 'Santosh', 'petroleum_admin', 'petroleum'),
('ambuj1234', '8790', 'Ambuj', 'crusher_admin', 'crusher');

-- Add shift_rate column to staff table
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS shift_rate NUMERIC DEFAULT 0;

-- Add shift_rate column to mlt_staff table
ALTER TABLE public.mlt_staff ADD COLUMN IF NOT EXISTS shift_rate NUMERIC DEFAULT 0;

-- Create salary_records table
CREATE TABLE public.salary_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL,
    staff_type TEXT NOT NULL CHECK (staff_type IN ('staff', 'mlt')),
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    total_shifts NUMERIC DEFAULT 0,
    shift_rate NUMERIC DEFAULT 0,
    gross_salary NUMERIC DEFAULT 0,
    total_advances NUMERIC DEFAULT 0,
    total_paid NUMERIC DEFAULT 0,
    pending_amount NUMERIC DEFAULT 0,
    is_paid BOOLEAN DEFAULT false,
    paid_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(staff_id, staff_type, month, year)
);

-- Enable RLS on salary_records
ALTER TABLE public.salary_records ENABLE ROW LEVEL SECURITY;

-- Allow all operations on salary_records (controlled by app logic)
CREATE POLICY "Allow all on salary_records"
ON public.salary_records
FOR ALL
USING (true);

-- Create trigger for updated_at on salary_records
CREATE TRIGGER update_salary_records_updated_at
BEFORE UPDATE ON public.salary_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();