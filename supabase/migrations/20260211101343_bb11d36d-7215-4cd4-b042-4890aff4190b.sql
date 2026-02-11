
-- Drop and recreate all "Authenticated access" policies to include anon role
-- staff
DROP POLICY "Authenticated access" ON public.staff;
CREATE POLICY "Public access" ON public.staff FOR ALL USING (true) WITH CHECK (true);

-- mlt_staff
DROP POLICY "Authenticated access" ON public.mlt_staff;
CREATE POLICY "Public access" ON public.mlt_staff FOR ALL USING (true) WITH CHECK (true);

-- attendance
DROP POLICY "Authenticated access" ON public.attendance;
CREATE POLICY "Public access" ON public.attendance FOR ALL USING (true) WITH CHECK (true);

-- mlt_attendance
DROP POLICY "Authenticated access" ON public.mlt_attendance;
CREATE POLICY "Public access" ON public.mlt_attendance FOR ALL USING (true) WITH CHECK (true);

-- payroll
DROP POLICY "Authenticated access" ON public.payroll;
CREATE POLICY "Public access" ON public.payroll FOR ALL USING (true) WITH CHECK (true);

-- salary_records
DROP POLICY "Authenticated access" ON public.salary_records;
CREATE POLICY "Public access" ON public.salary_records FOR ALL USING (true) WITH CHECK (true);

-- advances
DROP POLICY "Authenticated access" ON public.advances;
CREATE POLICY "Public access" ON public.advances FOR ALL USING (true) WITH CHECK (true);

-- mlt_advances
DROP POLICY "Authenticated access" ON public.mlt_advances;
CREATE POLICY "Public access" ON public.mlt_advances FOR ALL USING (true) WITH CHECK (true);

-- petroleum_sales
DROP POLICY "Authenticated access" ON public.petroleum_sales;
CREATE POLICY "Public access" ON public.petroleum_sales FOR ALL USING (true) WITH CHECK (true);

-- petroleum_payments
DROP POLICY "Authenticated access" ON public.petroleum_payments;
CREATE POLICY "Public access" ON public.petroleum_payments FOR ALL USING (true) WITH CHECK (true);

-- tyre_sales
DROP POLICY "Authenticated access" ON public.tyre_sales;
CREATE POLICY "Public access" ON public.tyre_sales FOR ALL USING (true) WITH CHECK (true);

-- credit_parties
DROP POLICY "Authenticated access" ON public.credit_parties;
CREATE POLICY "Public access" ON public.credit_parties FOR ALL USING (true) WITH CHECK (true);

-- credit_party_transactions
DROP POLICY "Authenticated access" ON public.credit_party_transactions;
CREATE POLICY "Public access" ON public.credit_party_transactions FOR ALL USING (true) WITH CHECK (true);

-- daily_photos
DROP POLICY "Authenticated access" ON public.daily_photos;
CREATE POLICY "Public access" ON public.daily_photos FOR ALL USING (true) WITH CHECK (true);

-- reminders
DROP POLICY "Authenticated access" ON public.reminders;
CREATE POLICY "Public access" ON public.reminders FOR ALL USING (true) WITH CHECK (true);

-- app_settings
DROP POLICY "Authenticated access" ON public.app_settings;
CREATE POLICY "Public access" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);
