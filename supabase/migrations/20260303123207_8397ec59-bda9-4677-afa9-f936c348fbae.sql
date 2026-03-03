
-- Add credit_limit to credit_parties
ALTER TABLE public.credit_parties ADD COLUMN IF NOT EXISTS credit_limit numeric DEFAULT 0;

-- Stock Inventory table
CREATE TABLE public.stock_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  current_stock numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'tonnes',
  low_stock_threshold numeric DEFAULT 50,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.stock_inventory FOR ALL USING (true) WITH CHECK (true);

-- Stock movements (auto-deduction log)
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  movement_type text NOT NULL DEFAULT 'production',
  quantity numeric NOT NULL DEFAULT 0,
  reference_id uuid,
  reference_type text,
  notes text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.stock_movements FOR ALL USING (true) WITH CHECK (true);

-- Production entries
CREATE TABLE public.production_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  crusher_hours numeric NOT NULL DEFAULT 0,
  product_name text NOT NULL,
  quantity_produced numeric NOT NULL DEFAULT 0,
  downtime_hours numeric DEFAULT 0,
  downtime_reason text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.production_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.production_entries FOR ALL USING (true) WITH CHECK (true);

-- Vehicle management
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_number text NOT NULL UNIQUE,
  driver_name text,
  insurance_expiry date,
  fitness_expiry date,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);

-- Vehicle maintenance records
CREATE TABLE public.vehicle_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  maintenance_type text NOT NULL,
  description text,
  cost numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  next_due_date date,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicle_maintenance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.vehicle_maintenance FOR ALL USING (true) WITH CHECK (true);

-- Activity logs
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_name text NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);

-- Party payments tracking
CREATE TABLE public.party_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id uuid REFERENCES public.credit_parties(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  payment_type text NOT NULL DEFAULT 'received',
  payment_mode text DEFAULT 'cash',
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.party_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON public.party_payments FOR ALL USING (true) WITH CHECK (true);

-- Dispatch cost tracking (for profit calculation)
ALTER TABLE public.dispatch_reports ADD COLUMN IF NOT EXISTS production_cost numeric DEFAULT 0;
ALTER TABLE public.dispatch_reports ADD COLUMN IF NOT EXISTS diesel_cost numeric DEFAULT 0;
ALTER TABLE public.dispatch_reports ADD COLUMN IF NOT EXISTS labour_cost numeric DEFAULT 0;

-- Insert default stock items
INSERT INTO public.stock_inventory (product_name, current_stock, unit, low_stock_threshold) VALUES
  ('20MM', 0, 'tonnes', 50),
  ('40MM', 0, 'tonnes', 50),
  ('Dust', 0, 'tonnes', 30),
  ('10MM', 0, 'tonnes', 30),
  ('Gitti', 0, 'tonnes', 30);
