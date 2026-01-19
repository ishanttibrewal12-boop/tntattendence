-- Create staff category enum
CREATE TYPE public.staff_category AS ENUM ('petroleum', 'crusher');

-- Add category to staff table
ALTER TABLE public.staff ADD COLUMN category staff_category NOT NULL DEFAULT 'petroleum';

-- Create advances table for tracking advance payments
CREATE TABLE public.advances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  is_deducted BOOLEAN NOT NULL DEFAULT false,
  deducted_from_payroll_id UUID REFERENCES public.payroll(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on advances
ALTER TABLE public.advances ENABLE ROW LEVEL SECURITY;

-- Allow all operations on advances (since no auth)
CREATE POLICY "Allow all operations on advances" ON public.advances FOR ALL USING (true);

-- Create trigger for advances updated_at
CREATE TRIGGER update_advances_updated_at
BEFORE UPDATE ON public.advances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();