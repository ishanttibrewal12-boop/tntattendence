
-- Add fuel_type column to credit_party_transactions table
-- Existing petroleum entries without fuel_type will show as "Unspecified"
ALTER TABLE public.credit_party_transactions
ADD COLUMN fuel_type text;

-- Add rate_per_litre column for petroleum entries
ALTER TABLE public.credit_party_transactions
ADD COLUMN rate_per_litre numeric;
