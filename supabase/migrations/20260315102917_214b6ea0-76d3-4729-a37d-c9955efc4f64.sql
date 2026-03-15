
ALTER TABLE public.staff 
  ADD COLUMN shift_rate_28 numeric DEFAULT 0,
  ADD COLUMN shift_rate_30 numeric DEFAULT 0,
  ADD COLUMN shift_rate_31 numeric DEFAULT 0;

ALTER TABLE public.mlt_staff 
  ADD COLUMN shift_rate_28 numeric DEFAULT 0,
  ADD COLUMN shift_rate_30 numeric DEFAULT 0,
  ADD COLUMN shift_rate_31 numeric DEFAULT 0;

-- Copy existing shift_rate to all three columns as default
UPDATE public.staff SET shift_rate_28 = COALESCE(shift_rate, 0), shift_rate_30 = COALESCE(shift_rate, 0), shift_rate_31 = COALESCE(shift_rate, 0);
UPDATE public.mlt_staff SET shift_rate_28 = COALESCE(shift_rate, 0), shift_rate_30 = COALESCE(shift_rate, 0), shift_rate_31 = COALESCE(shift_rate, 0);
