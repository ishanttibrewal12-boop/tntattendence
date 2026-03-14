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
    creditPartiesRes, dispatchRes, salaryRes,
  ] = await Promise.all([
    supabase.from('staff').select('id, name, category, is_active, shift_rate, base_salary').eq('is_active', true),
    supabase.from('mlt_staff').select('id, name, category, is_active, shift_rate').eq('is_active', true),
    supabase.from('attendance').select('id, staff_id, status, shift_count, date').eq('date', today),
    supabase.from('mlt_attendance').select('id, staff_id, status, shift_count, date').eq('date', today),
    supabase.from('vehicles').select('id, truck_number, driver_name, is_active, insurance_expiry, fitness_expiry').eq('is_active', true),
    supabase.from('petroleum_sales').select('amount, sale_type, date').gte('date', monthStart),
    supabase.from('tyre_sales').select('amount, date').gte('date', monthStart),
    supabase.from('crusher_fuel_entries').select('litres, total_cost, section, date').gte('date', monthStart),
    supabase.from('advances').select('amount, staff_id, date, is_deducted').gte('date', monthStart),
    supabase.from('mlt_advances').select('amount, staff_id, date, is_deducted').gte('date', monthStart),
    supabase.from('credit_parties').select('id, name, is_active').eq('is_active', true),
    supabase.from('dispatch_reports').select('date, party_name, product_name, truck_number, quantity, amount, challan_number').gte('date', monthStart).order('date', { ascending: false }).limit(50),
    supabase.from('salary_records').select('staff_id, staff_type, month, year, total_shifts, shift_rate, gross_salary, total_advances, total_paid, pending_amount, is_paid').order('year', { ascending: false }).order('month', { ascending: false }).limit(100),
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

  const petroleumTotal = petroleumSales.reduce((s: number, r: any) => s + Number(r.amount), 0);
  const tyreTotal = tyreSales.reduce((s: number, r: any) => s + Number(r.amount), 0);
  const fuelTotal = fuelEntries.reduce((s: number, r: any) => s + Number(r.total_cost || 0), 0);
  const fuelLitres = fuelEntries.reduce((s: number, r: any) => s + Number(r.litres), 0);
  const advancesTotal = advances.reduce((s: number, r: any) => s + Number(r.amount), 0);
  const mltAdvancesTotal = mltAdvances.reduce((s: number, r: any) => s + Number(r.amount), 0);

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

  // Dispatch summary
  const dispatchTotal = dispatches.reduce((s: number, r: any) => s + Number(r.amount), 0);
  const dispatchQty = dispatches.reduce((s: number, r: any) => s + Number(r.quantity), 0);

  // Salary summary
  const totalPaid = salaryRecords.filter((s: any) => s.is_paid).reduce((sum: number, s: any) => sum + Number(s.total_paid || 0), 0);
  const totalPending = salaryRecords.filter((s: any) => !s.is_paid).reduce((sum: number, s: any) => sum + Number(s.pending_amount || 0), 0);

  // Build staff name->salary map for recent records
  const staffMap = new Map(staff.map((s: any) => [s.id, s.name]));
  const mltMap = new Map(mltStaff.map((s: any) => [s.id, s.name]));

  return `
=== LIVE BUSINESS DATA (${today}) ===

STAFF SUMMARY:
- Total Active Staff: ${staff.length} (Petroleum: ${staffByCategory.petroleum}, Crusher: ${staffByCategory.crusher}, Office: ${staffByCategory.office})
- MLT Staff: ${mltStaff.length} (Drivers: ${mltByCategory.driver}, Khalasi: ${mltByCategory.khalasi})
- Staff list: ${staff.map((s: any) => `${s.name} (${s.category}, ₹${s.shift_rate}/shift)`).join(', ')}
- MLT list: ${mltStaff.map((s: any) => `${s.name} (${s.category}, ₹${s.shift_rate}/shift)`).join(', ')}

TODAY'S ATTENDANCE:
- Crusher/Petroleum/Office: ${todayAtt.length} marked — ${presentToday} present, ${absentToday} absent, ${halfDayToday} half-day (of ${staff.length} total)
- MLT: ${todayMltAtt.length} marked — ${mltPresentToday} present (of ${mltStaff.length} total)

THIS MONTH (${monthStart} to ${today}):
- Petroleum Sales: ₹${petroleumTotal.toLocaleString('en-IN')} (${petroleumSales.length} entries)
- Tyre Sales: ₹${tyreTotal.toLocaleString('en-IN')} (${tyreSales.length} entries)
- Crusher Fuel: ${fuelLitres} litres, ₹${fuelTotal.toLocaleString('en-IN')} total cost
- Advances Given: ₹${advancesTotal.toLocaleString('en-IN')} (Staff), ₹${mltAdvancesTotal.toLocaleString('en-IN')} (MLT)

DISPATCH REPORTS (This Month):
- Total Dispatches: ${dispatches.length} entries
- Total Quantity: ${dispatchQty} units, Total Amount: ₹${dispatchTotal.toLocaleString('en-IN')}
- Recent dispatches: ${dispatches.slice(0, 10).map((d: any) => `${d.date}: ${d.product_name} to ${d.party_name} via ${d.truck_number} (${d.quantity} units, ₹${Number(d.amount).toLocaleString('en-IN')})`).join('; ')}

SALARY RECORDS (Recent):
- Total Paid: ₹${totalPaid.toLocaleString('en-IN')}
- Total Pending: ₹${totalPending.toLocaleString('en-IN')}
- Recent records: ${salaryRecords.slice(0, 15).map((s: any) => {
    const name = staffMap.get(s.staff_id) || mltMap.get(s.staff_id) || 'Unknown';
    return `${name} (${s.month}/${s.year}): Gross ₹${Number(s.gross_salary || 0).toLocaleString('en-IN')}, Paid ₹${Number(s.total_paid || 0).toLocaleString('en-IN')}, Pending ₹${Number(s.pending_amount || 0).toLocaleString('en-IN')} [${s.is_paid ? 'PAID' : 'UNPAID'}]`;
  }).join('; ')}

VEHICLES:
- Active Fleet: ${vehicles.length} vehicles
- Expiring in 30 days: ${expiringVehicles.length > 0 ? expiringVehicles.map((v: any) => `${v.truck_number} (Ins: ${v.insurance_expiry || 'N/A'}, Fit: ${v.fitness_expiry || 'N/A'})`).join(', ') : 'None'}

CREDIT PARTIES: ${creditParties.length} active parties
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
      // Landing page - public info only
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
      // Dashboard - full data access
      let dataContext = "";
      try {
        dataContext = await fetchBusinessContext(supabase);
      } catch (e) {
        console.error("Failed to fetch business context:", e);
        dataContext = "\n[Could not fetch live data]\n";
      }

      systemPrompt = `You are a helpful AI assistant for Tibrewal & Tibrewal Private Limited, a mining and logistics company in Jharkhand, India established in 2021. The company operates stone crushing, a fleet of 50+ trucks, a Bharat Petroleum fuel station, and Tibrewal Tyres. Proprietor: Trishav Tibrewal.

You help the management team with:
- Staff management, attendance tracking, and salary queries
- Vehicle fleet and logistics operations
- Crusher operations, fuel analysis, and production
- Petroleum sales and tyre business
- Dispatch reports and delivery tracking
- Salary records, advances, and payment status
- Financial calculations, reports, and business insights
- General business advice and problem solving

${dataContext}

IMPORTANT RULES:
- Use Indian Rupee (₹) for all currency
- Answer in Hindi or English based on user's language
- When asked about data, use the LIVE BUSINESS DATA above — do not make up numbers
- If data is not available for a specific query, say so honestly
- Format responses with markdown for readability
- Be concise and professional
- Salary formula: (Total Shifts × Shift Rate) - Total Advances + Carry Forward = Payable`;
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

    // We need to tee the stream to save the assistant response
    if (sessionId) {
      const [streamForClient, streamForSave] = response.body!.tee();

      // Save assistant response in background
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

      // Don't await the save - let it run in background
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
