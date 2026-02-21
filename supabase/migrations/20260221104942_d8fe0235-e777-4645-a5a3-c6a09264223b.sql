
-- Make challan_number optional in both tables
ALTER TABLE public.dispatch_reports ALTER COLUMN challan_number DROP NOT NULL;
ALTER TABLE public.bolder_reports ALTER COLUMN challan_number DROP NOT NULL;

-- Set default to empty string for existing constraint compatibility
ALTER TABLE public.dispatch_reports ALTER COLUMN challan_number SET DEFAULT '';
ALTER TABLE public.bolder_reports ALTER COLUMN challan_number SET DEFAULT '';

-- Add RST number (optional) to both tables
ALTER TABLE public.dispatch_reports ADD COLUMN rst_number TEXT DEFAULT '';
ALTER TABLE public.bolder_reports ADD COLUMN rst_number TEXT DEFAULT '';
