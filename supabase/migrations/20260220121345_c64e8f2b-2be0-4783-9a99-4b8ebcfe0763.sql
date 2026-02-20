
-- Dispatch Reports table
CREATE TABLE public.dispatch_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  party_name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  truck_number TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  quantity NUMERIC NOT NULL DEFAULT 0,
  product_name TEXT NOT NULL,
  challan_number TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.dispatch_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access" ON public.dispatch_reports FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_dispatch_reports_date ON public.dispatch_reports(date);
CREATE INDEX idx_dispatch_reports_party ON public.dispatch_reports(party_name);

-- Bolder Reports table
CREATE TABLE public.bolder_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  quality TEXT NOT NULL,
  challan_number TEXT NOT NULL,
  truck_number TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bolder_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access" ON public.bolder_reports FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_bolder_reports_date ON public.bolder_reports(date);
CREATE INDEX idx_bolder_reports_company ON public.bolder_reports(company_name);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.dispatch_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bolder_reports;
