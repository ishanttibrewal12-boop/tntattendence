import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function fetchBusinessContext(supabase: any): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.slice(0, 7) + '-01';

  const [
    staffRes, mltStaffRes, todayAttRes, todayMltAttRes, vehiclesRes,
    petroleumRes, tyreRes, fuelRes, advancesRes, mltAdvancesRes,
    creditPartiesRes, dispatchRes, salaryRes, payrollRes,
    productionRes, bolderRes, petPayRes, mltFuelRes, mltServicesRes,
    stockRes, stockMovRes, creditTxRes, partyPayRes, remindersRes,
    crusherSectionsRes, maintenanceRes, activityRes,
  ] = await Promise.all([
    supabase.from('staff').select('id, name, category, is_active, shift_rate, base_salary, phone, designation, joining_date').eq('is_active', true),
    supabase.from('mlt_staff').select('id, name, category, is_active, shift_rate, base_salary, phone, designation').eq('is_active', true),
    supabase.from('attendance').select('id, staff_id, status, shift_count, date, notes').eq('date', today),
    supabase.from('mlt_attendance').select('id, staff_id, status, shift_count, date, notes').eq('date', today),
    supabase.from('vehicles').select('id, truck_number, driver_name, is_active, insurance_expiry, fitness_expiry, notes').eq('is_active', true),
    supabase.from('petroleum_sales').select('amount, sale_type, date, notes').gte('date', monthStart),
    supabase.from('tyre_sales').select('amount, date, notes').gte('date', monthStart),
    supabase.from('crusher_fuel_entries').select('litres, total_cost, section, date, running_hours, rate_per_litre, notes').gte('date', monthStart),
    supabase.from('advances').select('amount, staff_id, date, is_deducted, notes').gte('date', monthStart),
    supabase.from('mlt_advances').select('amount, staff_id, date, is_deducted, notes').gte('date', monthStart),
    supabase.from('credit_parties').select('id, name, is_active, phone, credit_limit').eq('is_active', true),
    supabase.from('dispatch_reports').select('*').gte('date', monthStart).order('date', { ascending: false }).limit(100),
    supabase.from('salary_records').select('*').order('year', { ascending: false }).order('month', { ascending: false }).limit(200),
    supabase.from('payroll').select('*').order('year', { ascending: false }).order('month', { ascending: false }).limit(200),
    supabase.from('production_entries').select('*').gte('date', monthStart).order('date', { ascending: false }),
    supabase.from('bolder_reports').select('*').gte('date', monthStart).order('date', { ascending: false }).limit(50),
    supabase.from('petroleum_payments').select('*').gte('date', monthStart),
    supabase.from('mlt_fuel_reports').select('*').gte('date', monthStart).order('date', { ascending: false }),
    supabase.from('mlt_services').select('*').gte('date', monthStart).order('date', { ascending: false }),
    supabase.from('stock_inventory').select('*'),
    supabase.from('stock_movements').select('*').gte('date', monthStart).order('date', { ascending: false }).limit(50),
    supabase.from('credit_party_transactions').select('*').gte('date', monthStart).order('date', { ascending: false }).limit(100),
    supabase.from('party_payments').select('*').gte('date', monthStart).order('date', { ascending: false }).limit(100),
    supabase.from('reminders').select('*').order('reminder_date', { ascending: true }).limit(20),
    supabase.from('crusher_fuel_sections').select('*'),
    supabase.from('vehicle_maintenance').select('*').gte('date', monthStart).order('date', { ascending: false }).limit(50),
    supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(20),
  ]);

  const staff = staffRes.data || [];
  const mltStaff = mltStaffRes.data || [];
  const todayAtt = todayAttRes.data || [];
  const todayMltAtt = todayMltAttRes.data || [];
  const vehicles = vehiclesRes.data || [];
  const petroleumSales = petroleumRes.data || [];
  const tyreSales = tyreRes.data || [];
  const fuelEntries = fuelRes.data || [];
  const advances = advancesRes.data || [];
  const mltAdvances = mltAdvancesRes.data || [];
  const creditParties = creditPartiesRes.data || [];
  const dispatches = dispatchRes.data || [];
  const salaryRecords = salaryRes.data || [];
  const payrollRecords = payrollRes.data || [];
  const productions = productionRes.data || [];
  const bolders = bolderRes.data || [];
  const petPayments = petPayRes.data || [];
  const mltFuel = mltFuelRes.data || [];
  const mltServices = mltServicesRes.data || [];
  const stockItems = stockRes.data || [];
  const stockMoves = stockMovRes.data || [];
  const creditTxs = creditTxRes.data || [];
  const partyPays = partyPayRes.data || [];
  const reminders = remindersRes.data || [];
  const crusherSections = crusherSectionsRes.data || [];
  const maintenance = maintenanceRes.data || [];
  const activityLogs = activityRes.data || [];

  // Summaries
  const petroleumTotal = petroleumSales.reduce((s: number, r: any) => s + Number(r.amount), 0);
  const tyreTotal = tyreSales.reduce((s: number, r: any) => s + Number(r.amount), 0);
  const fuelTotal = fuelEntries.reduce((s: number, r: any) => s + Number(r.total_cost || 0), 0);
  const fuelLitres = fuelEntries.reduce((s: number, r: any) => s + Number(r.litres), 0);
  const advancesTotal = advances.reduce((s: number, r: any) => s + Number(r.amount), 0);
  const mltAdvancesTotal = mltAdvances.reduce((s: number, r: any) => s + Number(r.amount), 0);
  const petPayTotal = petPayments.reduce((s: number, r: any) => s + Number(r.amount), 0);
  const dispatchTotal = dispatches.reduce((s: number, r: any) => s + Number(r.amount), 0);
  const dispatchQty = dispatches.reduce((s: number, r: any) => s + Number(r.quantity), 0);
  const productionQty = productions.reduce((s: number, r: any) => s + Number(r.quantity_produced), 0);
  const productionHours = productions.reduce((s: number, r: any) => s + Number(r.crusher_hours), 0);
  const mltFuelLitres = mltFuel.reduce((s: number, r: any) => s + Number(r.fuel_litres), 0);
  const mltFuelAmount = mltFuel.reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
  const mltServiceTotal = mltServices.reduce((s: number, r: any) => s + Number(r.amount), 0);
  const maintenanceCost = maintenance.reduce((s: number, r: any) => s + Number(r.cost), 0);
  const creditTxTotal = creditTxs.reduce((s: number, r: any) => s + Number(r.amount), 0);
  const partyPayTotal = partyPays.reduce((s: number, r: any) => s + Number(r.amount), 0);

  const presentToday = todayAtt.filter((a: any) => a.status === 'present').length;
  const absentToday = todayAtt.filter((a: any) => a.status === 'absent').length;
  const halfDayToday = todayAtt.filter((a: any) => a.status === 'half_day').length;
  const mltPresentToday = todayMltAtt.filter((a: any) => a.status === 'present').length;

  const staffByCategory = {
    petroleum: staff.filter((s: any) => s.category === 'petroleum').length,
    crusher: staff.filter((s: any) => s.category === 'crusher').length,
    office: staff.filter((s: any) => s.category === 'office').length,
  };
  const mltByCategory = {
    driver: mltStaff.filter((s: any) => s.category === 'driver').length,
    khalasi: mltStaff.filter((s: any) => s.category === 'khalasi').length,
  };

  const thirtyDaysLater = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  const expiringVehicles = vehicles.filter((v: any) =>
    (v.insurance_expiry && v.insurance_expiry <= thirtyDaysLater) ||
    (v.fitness_expiry && v.fitness_expiry <= thirtyDaysLater)
  );

  const staffMap = new Map(staff.map((s: any) => [s.id, s.name]));
  const mltMap = new Map(mltStaff.map((s: any) => [s.id, s.name]));
  const vehicleMap = new Map(vehicles.map((v: any) => [v.id, v.truck_number]));
  const partyMap = new Map(creditParties.map((p: any) => [p.id, p.name]));

  // Salary summaries
  const totalPaid = salaryRecords.filter((s: any) => s.is_paid).reduce((sum: number, s: any) => sum + Number(s.total_paid || 0), 0);
  const totalPending = salaryRecords.filter((s: any) => !s.is_paid).reduce((sum: number, s: any) => sum + Number(s.pending_amount || 0), 0);
  const payrollPaid = payrollRecords.filter((p: any) => p.is_paid).reduce((sum: number, p: any) => sum + Number(p.net_salary || 0), 0);
  const payrollPending = payrollRecords.filter((p: any) => !p.is_paid).reduce((sum: number, p: any) => sum + Number(p.net_salary || 0), 0);

  // Low stock alerts
  const lowStock = stockItems.filter((s: any) => s.current_stock <= (s.low_stock_threshold || 50));

  // Upcoming reminders
  const upcomingReminders = reminders.filter((r: any) => !r.is_sent && r.reminder_date >= today);

  return `
=== LIVE BUSINESS DATA (${today}) ===

STAFF SUMMARY:
- Total Active Staff: ${staff.length} (Petroleum: ${staffByCategory.petroleum}, Crusher: ${staffByCategory.crusher}, Office: ${staffByCategory.office})
- MLT Staff: ${mltStaff.length} (Drivers: ${mltByCategory.driver}, Khalasi: ${mltByCategory.khalasi})
- Staff details: ${staff.map((s: any) => `${s.name} (${s.category}, ₹${s.shift_rate}/shift, ₹${s.base_salary} base, ${s.designation || 'N/A'}, Ph: ${s.phone || 'N/A'})`).join('; ')}
- MLT details: ${mltStaff.map((s: any) => `${s.name} (${s.category}, ₹${s.shift_rate}/shift, ₹${s.base_salary} base, Ph: ${s.phone || 'N/A'})`).join('; ')}

TODAY'S ATTENDANCE (${today}):
- Crusher/Petroleum/Office: ${todayAtt.length} marked — ${presentToday} present, ${absentToday} absent, ${halfDayToday} half-day (of ${staff.length} total)
- MLT: ${todayMltAtt.length} marked — ${mltPresentToday} present (of ${mltStaff.length} total)
- Today's attendance details: ${todayAtt.map((a: any) => `${staffMap.get(a.staff_id) || 'Unknown'}: ${a.status}${a.shift_count ? ' (' + a.shift_count + ' shifts)' : ''}${a.notes ? ' - ' + a.notes : ''}`).join('; ')}
- Today's MLT attendance: ${todayMltAtt.map((a: any) => `${mltMap.get(a.staff_id) || 'Unknown'}: ${a.status}${a.shift_count ? ' (' + a.shift_count + ' shifts)' : ''}`).join('; ')}

THIS MONTH FINANCIALS (${monthStart} to ${today}):
- Petroleum Sales: ₹${petroleumTotal.toLocaleString('en-IN')} (${petroleumSales.length} entries) — by type: ${Object.entries(petroleumSales.reduce((acc: any, s: any) => { acc[s.sale_type] = (acc[s.sale_type] || 0) + Number(s.amount); return acc; }, {})).map(([k, v]) => `${k}: ₹${Number(v).toLocaleString('en-IN')}`).join(', ')}
- Petroleum Payments: ₹${petPayTotal.toLocaleString('en-IN')} (${petPayments.length} entries)
- Tyre Sales: ₹${tyreTotal.toLocaleString('en-IN')} (${tyreSales.length} entries)
- Crusher Fuel: ${fuelLitres} litres, ₹${fuelTotal.toLocaleString('en-IN')} cost (${fuelEntries.length} entries)
- Advances Given: ₹${advancesTotal.toLocaleString('en-IN')} (Staff), ₹${mltAdvancesTotal.toLocaleString('en-IN')} (MLT)

DISPATCH REPORTS (This Month — ${dispatches.length} entries):
- Total Quantity: ${dispatchQty} units, Total Amount: ₹${dispatchTotal.toLocaleString('en-IN')}
- Recent: ${dispatches.slice(0, 15).map((d: any) => `${d.date}: ${d.product_name} to ${d.party_name} via ${d.truck_number} (${d.quantity} units, ₹${Number(d.amount).toLocaleString('en-IN')}, Challan: ${d.challan_number || 'N/A'}${d.diesel_cost ? ', Diesel: ₹' + d.diesel_cost : ''}${d.labour_cost ? ', Labour: ₹' + d.labour_cost : ''})`).join('; ')}

PRODUCTION (This Month — ${productions.length} entries):
- Total Produced: ${productionQty} units, Crusher Hours: ${productionHours}
- Details: ${productions.slice(0, 15).map((p: any) => `${p.date}: ${p.product_name} — ${p.quantity_produced} units in ${p.crusher_hours}h${p.downtime_hours ? ' (Downtime: ' + p.downtime_hours + 'h - ' + (p.downtime_reason || '') + ')' : ''}`).join('; ')}

BOLDER REPORTS (This Month — ${bolders.length} entries):
- Details: ${bolders.slice(0, 10).map((b: any) => `${b.date}: ${b.company_name} — ${b.quality}, Truck: ${b.truck_number}, Challan: ${b.challan_number || 'N/A'}`).join('; ')}

SALARY RECORDS (Recent):
- Staff Salary — Total Paid: ₹${totalPaid.toLocaleString('en-IN')}, Total Pending: ₹${totalPending.toLocaleString('en-IN')}
- Payroll — Total Paid: ₹${payrollPaid.toLocaleString('en-IN')}, Total Pending: ₹${payrollPending.toLocaleString('en-IN')}
- Recent salary records: ${salaryRecords.slice(0, 20).map((s: any) => {
    const name = staffMap.get(s.staff_id) || mltMap.get(s.staff_id) || 'Unknown';
    return `${name} (${s.staff_type}, ${s.month}/${s.year}): ${s.total_shifts} shifts × ₹${s.shift_rate}/shift = Gross ₹${Number(s.gross_salary || 0).toLocaleString('en-IN')}, Advances ₹${Number(s.total_advances || 0).toLocaleString('en-IN')}, Paid ₹${Number(s.total_paid || 0).toLocaleString('en-IN')}, Pending ₹${Number(s.pending_amount || 0).toLocaleString('en-IN')} [${s.is_paid ? 'PAID' : 'UNPAID'}]`;
  }).join('; ')}
- Payroll details: ${payrollRecords.slice(0, 20).map((p: any) => {
    const name = staffMap.get(p.staff_id) || 'Unknown';
    return `${name} (${p.month}/${p.year}): ${p.present_days}P/${p.absent_days}A/${p.half_days}H days, Base ₹${Number(p.base_salary).toLocaleString('en-IN')}, Deductions ₹${Number(p.deductions).toLocaleString('en-IN')}, Bonus ₹${Number(p.bonus).toLocaleString('en-IN')}, Net ₹${Number(p.net_salary).toLocaleString('en-IN')} [${p.is_paid ? 'PAID' : 'UNPAID'}]`;
  }).join('; ')}

MLT FUEL REPORTS (This Month — ${mltFuel.length} entries):
- Total: ${mltFuelLitres} litres, ₹${mltFuelAmount.toLocaleString('en-IN')}
- Details: ${mltFuel.slice(0, 15).map((f: any) => `${f.date}: ${f.truck_number} — ${f.fuel_litres}L, ₹${Number(f.amount || 0).toLocaleString('en-IN')}, Driver: ${f.driver_name || 'N/A'}`).join('; ')}

MLT SERVICES (This Month — ${mltServices.length} entries):
- Total Cost: ₹${mltServiceTotal.toLocaleString('en-IN')}
- Details: ${mltServices.slice(0, 10).map((s: any) => `${s.date}: ${s.truck_number} at ${s.service_place} — ${s.work_description}, ₹${Number(s.amount).toLocaleString('en-IN')}`).join('; ')}

VEHICLES:
- Active Fleet: ${vehicles.length} vehicles
- Details: ${vehicles.map((v: any) => `${v.truck_number} (Driver: ${v.driver_name || 'N/A'}, Ins: ${v.insurance_expiry || 'N/A'}, Fit: ${v.fitness_expiry || 'N/A'})`).join('; ')}
- Expiring in 30 days: ${expiringVehicles.length > 0 ? expiringVehicles.map((v: any) => `${v.truck_number}`).join(', ') : 'None'}
- Maintenance this month: ${maintenance.length} records, Total Cost: ₹${maintenanceCost.toLocaleString('en-IN')}
- Maintenance details: ${maintenance.slice(0, 10).map((m: any) => `${m.date}: ${vehicleMap.get(m.vehicle_id) || 'Unknown'} — ${m.maintenance_type}: ${m.description || ''}, ₹${Number(m.cost).toLocaleString('en-IN')}${m.next_due_date ? ', Next due: ' + m.next_due_date : ''}`).join('; ')}

CRUSHER FUEL SECTIONS: ${crusherSections.map((s: any) => s.name).join(', ')}
- Fuel by section: ${Object.entries(fuelEntries.reduce((acc: any, f: any) => { acc[f.section] = (acc[f.section] || 0) + Number(f.litres); return acc; }, {})).map(([k, v]) => `${k}: ${v}L`).join(', ')}

STOCK INVENTORY:
- Items: ${stockItems.map((s: any) => `${s.product_name}: ${s.current_stock} ${s.unit}${s.current_stock <= (s.low_stock_threshold || 50) ? ' ⚠️LOW' : ''}`).join('; ')}
- Recent movements: ${stockMoves.slice(0, 10).map((m: any) => `${m.date}: ${m.product_name} ${m.movement_type} ${m.quantity} ${m.notes || ''}`).join('; ')}

CREDIT PARTIES (${creditParties.length} active):
- Parties: ${creditParties.map((p: any) => `${p.name} (Limit: ₹${Number(p.credit_limit || 0).toLocaleString('en-IN')}, Ph: ${p.phone || 'N/A'})`).join('; ')}
- Recent transactions: ${creditTxs.slice(0, 15).map((t: any) => `${t.date}: ${partyMap.get(t.party_id) || 'Unknown'} — ${t.transaction_type} ₹${Number(t.amount).toLocaleString('en-IN')}${t.litres ? ' (' + t.litres + 'L)' : ''}${t.tyre_name ? ' Tyre: ' + t.tyre_name : ''}`).join('; ')}
- Recent payments: ${partyPays.slice(0, 10).map((p: any) => `${p.date}: ${partyMap.get(p.party_id) || 'Unknown'} — ${p.payment_type} ₹${Number(p.amount).toLocaleString('en-IN')} via ${p.payment_mode || 'N/A'}`).join('; ')}

REMINDERS:
- Upcoming: ${upcomingReminders.length > 0 ? upcomingReminders.map((r: any) => `${r.reminder_date} ${r.reminder_time}: ${r.title}${r.message ? ' - ' + r.message : ''}`).join('; ') : 'None'}

RECENT ACTIVITY (Last 20):
${activityLogs.slice(0, 10).map((l: any) => `- ${l.user_name} ${l.action} on ${l.table_name} (${new Date(l.created_at).toLocaleString()})`).join('\n')}
`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, includeData, sessionId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Save user message to database
    const lastMsg = messages[messages.length - 1];
    if (sessionId && lastMsg?.role === 'user') {
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        role: 'user',
        content: lastMsg.content,
      });
    }

    let systemPrompt: string;

    if (includeData === false) {
      systemPrompt = `You are a helpful AI assistant for the website of Tibrewal & Tibrewal Private Limited — a prominent mining and logistics business group based in Jharkhand, India, established in 2021.

PUBLIC COMPANY INFORMATION (only share this):
- **Stone Crushing & Aggregate Production**: Large-scale stone crushing operations producing high-quality aggregates
- **Logistics Fleet**: 50+ trucks for mining and logistics transportation
- **Bharat Petroleum Fuel Station**: Authorized fuel distribution
- **Tibrewal Tyres**: Commercial tyre trading
- **Workforce**: 200+ employees across all operations
- **Proprietor**: Trishav Tibrewal (Contact: 9386469006)
- **Operations Support Contact**: 6203229118
- **Location**: Jharkhand, India

RULES:
- ONLY answer questions about the company's public information listed above
- Do NOT share any internal business data like staff names, salary details, attendance records, financial figures, etc.
- If someone asks about internal data, politely say "Please log in to the management portal for detailed business information."
- Be friendly, professional, and helpful
- Answer in Hindi or English based on user's language
- Use Indian Rupee (₹) for currency references
- Format responses with markdown`;
    } else {
      let dataContext = "";
      try {
        dataContext = await fetchBusinessContext(supabase);
      } catch (e) {
        console.error("Failed to fetch business context:", e);
        dataContext = "\n[Could not fetch live data]\n";
      }

      systemPrompt = `You are a powerful AI business assistant for Tibrewal & Tibrewal Private Limited, a mining and logistics company in Jharkhand, India established in 2021. Proprietor: Trishav Tibrewal.

You have FULL ACCESS to all business data. You help the management team with ANY query about:
- Staff management (names, roles, salaries, attendance, advances, contact details)
- Vehicle fleet (truck numbers, drivers, insurance/fitness expiry, maintenance)
- Crusher operations (fuel analysis by section, production entries, running hours, downtime)
- Petroleum sales & payments (daily/monthly totals by payment type)
- Tyre sales and credit party transactions
- Dispatch reports (quantities, parties, truck details, challans, costs)
- Salary & payroll records (shifts, rates, gross/net salary, advances, pending amounts)
- MLT operations (fuel reports, services, staff, attendance)
- Stock inventory & movements (current levels, low stock alerts)
- Credit parties (balances, transactions, payments)
- Bolder reports (company, quality, challan details)
- Reminders and activity logs
- Financial calculations, profit analysis, and business insights

${dataContext}

IMPORTANT RULES:
- Use Indian Rupee (₹) for all currency
- Answer in Hindi or English based on user's language
- Use the LIVE BUSINESS DATA above — never make up numbers
- If data is not available, say so honestly
- Format responses with markdown tables when showing tabular data
- Be concise, accurate, and professional
- For salary: (Total Shifts × Shift Rate) - Total Advances + Carry Forward = Payable
- You can cross-reference data across tables (e.g., link staff attendance to salary, dispatch costs to profit)`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (sessionId) {
      const [streamForClient, streamForSave] = response.body!.tee();

      const savePromise = (async () => {
        const reader = streamForSave.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let buf = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buf.indexOf('\n')) !== -1) {
            let line = buf.slice(0, idx);
            buf = buf.slice(idx + 1);
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullContent += content;
            } catch {}
          }
        }
        if (fullContent) {
          await supabase.from('chat_messages').insert({
            session_id: sessionId,
            role: 'assistant',
            content: fullContent,
          });
        }
      })();

      savePromise.catch(e => console.error("Failed to save assistant message:", e));

      return new Response(streamForClient, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
