-- Create new enum for MLT staff categories
DO $$ BEGIN
    CREATE TYPE mlt_staff_category AS ENUM ('driver', 'khalasi');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create MLT staff table
CREATE TABLE IF NOT EXISTS public.mlt_staff (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category mlt_staff_category NOT NULL DEFAULT 'driver',
    phone TEXT,
    address TEXT,
    designation TEXT,
    notes TEXT,
    photo_url TEXT,
    base_salary NUMERIC NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create MLT attendance table
CREATE TABLE IF NOT EXISTS public.mlt_attendance (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID NOT NULL REFERENCES public.mlt_staff(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'present',
    shift_count INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(staff_id, date)
);

-- Create MLT advances table
CREATE TABLE IF NOT EXISTS public.mlt_advances (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID NOT NULL REFERENCES public.mlt_staff(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    is_deducted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Petroleum Payments (UPI) table
CREATE TABLE IF NOT EXISTS public.petroleum_payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    amount NUMERIC NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_type TEXT NOT NULL DEFAULT 'upi',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Petroleum Sales table
CREATE TABLE IF NOT EXISTS public.petroleum_sales (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    amount NUMERIC NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    sale_type TEXT NOT NULL DEFAULT 'upi',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.mlt_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mlt_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mlt_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petroleum_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petroleum_sales ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for MLT staff
CREATE POLICY "Allow all operations on mlt_staff" ON public.mlt_staff FOR ALL USING (true);

-- Create RLS policies for MLT attendance
CREATE POLICY "Allow all operations on mlt_attendance" ON public.mlt_attendance FOR ALL USING (true);

-- Create RLS policies for MLT advances
CREATE POLICY "Allow all operations on mlt_advances" ON public.mlt_advances FOR ALL USING (true);

-- Create RLS policies for petroleum_payments
CREATE POLICY "Allow all operations on petroleum_payments" ON public.petroleum_payments FOR ALL USING (true);

-- Create RLS policies for petroleum_sales
CREATE POLICY "Allow all operations on petroleum_sales" ON public.petroleum_sales FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mlt_attendance_date ON public.mlt_attendance(date);
CREATE INDEX IF NOT EXISTS idx_mlt_attendance_staff_id ON public.mlt_attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_mlt_advances_date ON public.mlt_advances(date);
CREATE INDEX IF NOT EXISTS idx_mlt_advances_staff_id ON public.mlt_advances(staff_id);
CREATE INDEX IF NOT EXISTS idx_petroleum_payments_date ON public.petroleum_payments(date);
CREATE INDEX IF NOT EXISTS idx_petroleum_sales_date ON public.petroleum_sales(date);