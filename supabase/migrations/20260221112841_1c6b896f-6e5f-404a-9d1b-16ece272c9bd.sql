
-- Create MLT Services table
CREATE TABLE public.mlt_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_number text NOT NULL,
  driver_name text,
  service_place text NOT NULL,
  work_description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.mlt_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access" ON public.mlt_services FOR ALL USING (true) WITH CHECK (true);

-- Create MLT Fuel Reports table
CREATE TABLE public.mlt_fuel_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_number text NOT NULL,
  fuel_litres numeric NOT NULL DEFAULT 0,
  amount numeric,
  date date NOT NULL DEFAULT CURRENT_DATE,
  driver_name text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.mlt_fuel_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access" ON public.mlt_fuel_reports FOR ALL USING (true) WITH CHECK (true);
