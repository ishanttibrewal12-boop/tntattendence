
-- Tyre Sales table
CREATE TABLE public.tyre_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amount NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tyre_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on tyre_sales"
ON public.tyre_sales FOR ALL
USING (true);

CREATE TRIGGER update_tyre_sales_updated_at
BEFORE UPDATE ON public.tyre_sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Credit Parties table
CREATE TABLE public.credit_parties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on credit_parties"
ON public.credit_parties FOR ALL
USING (true);

CREATE TRIGGER update_credit_parties_updated_at
BEFORE UPDATE ON public.credit_parties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Credit Party Transactions table
CREATE TABLE public.credit_party_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  party_id UUID NOT NULL REFERENCES public.credit_parties(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL DEFAULT 'petroleum',
  amount NUMERIC NOT NULL DEFAULT 0,
  litres NUMERIC,
  tyre_name TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_party_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on credit_party_transactions"
ON public.credit_party_transactions FOR ALL
USING (true);

CREATE TRIGGER update_credit_party_transactions_updated_at
BEFORE UPDATE ON public.credit_party_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
