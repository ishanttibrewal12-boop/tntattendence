
CREATE TABLE public.crusher_fuel_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  section text NOT NULL,
  litres numeric NOT NULL DEFAULT 0,
  running_hours numeric NOT NULL DEFAULT 0,
  rate_per_litre numeric NOT NULL DEFAULT 0,
  total_cost numeric GENERATED ALWAYS AS (litres * rate_per_litre) STORED,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crusher_fuel_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access" ON public.crusher_fuel_entries FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.crusher_fuel_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_preset boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crusher_fuel_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access" ON public.crusher_fuel_sections FOR ALL USING (true) WITH CHECK (true);

-- Insert preset sections
INSERT INTO public.crusher_fuel_sections (name, is_preset) VALUES
  ('Crusher Machine', true),
  ('Generator', true),
  ('JCB/Loader', true),
  ('Water Pump', true),
  ('Transport Vehicle', true);
