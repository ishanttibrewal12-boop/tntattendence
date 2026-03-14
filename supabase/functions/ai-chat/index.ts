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
    staffRes,
    mltStaffRes,
    todayAttRes,
    todayMltAttRes,
    vehiclesRes,
    petroleumRes,
    tyreRes,
    fuelRes,
    advancesRes,
    mltAdvancesRes,
    creditPartiesRes,
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

  // Compute summaries
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

  // Expiring vehicles
  const thirtyDaysLater = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  const expiringVehicles = vehicles.filter((v: any) =>
    (v.insurance_expiry && v.insurance_expiry <= thirtyDaysLater) ||
    (v.fitness_expiry && v.fitness_expiry <= thirtyDaysLater)
  );

  return `
=== LIVE BUSINESS DATA (${today}) ===

STAFF SUMMARY:
- Total Active Staff: ${staff.length} (Petroleum: ${staffByCategory.petroleum}, Crusher: ${staffByCategory.crusher}, Office: ${staffByCategory.office})
- MLT Staff: ${mltStaff.length} (Drivers: ${mltByCategory.driver}, Khalasi: ${mltByCategory.khalasi})
- Staff names: ${staff.map((s: any) => `${s.name} (${s.category}, ₹${s.shift_rate}/shift)`).join(', ')}
- MLT names: ${mltStaff.map((s: any) => `${s.name} (${s.category}, ₹${s.shift_rate}/shift)`).join(', ')}

TODAY'S ATTENDANCE:
- Crusher/Petroleum/Office: ${todayAtt.length} marked — ${presentToday} present, ${absentToday} absent, ${halfDayToday} half-day (of ${staff.length} total)
- MLT: ${todayMltAtt.length} marked — ${mltPresentToday} present (of ${mltStaff.length} total)

THIS MONTH (${monthStart} to ${today}):
- Petroleum Sales: ₹${petroleumTotal.toLocaleString('en-IN')} (${petroleumSales.length} entries)
- Tyre Sales: ₹${tyreTotal.toLocaleString('en-IN')} (${tyreSales.length} entries)
- Crusher Fuel: ${fuelLitres} litres, ₹${fuelTotal.toLocaleString('en-IN')} total cost
- Advances Given: ₹${advancesTotal.toLocaleString('en-IN')} (Staff), ₹${mltAdvancesTotal.toLocaleString('en-IN')} (MLT)

VEHICLES:
- Active Fleet: ${vehicles.length} vehicles
- Vehicles expiring in 30 days: ${expiringVehicles.length > 0 ? expiringVehicles.map((v: any) => `${v.truck_number} (Ins: ${v.insurance_expiry || 'N/A'}, Fit: ${v.fitness_expiry || 'N/A'})`).join(', ') : 'None'}

CREDIT PARTIES: ${creditParties.length} active parties
`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, includeData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let dataContext = "";
    if (includeData !== false) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        dataContext = await fetchBusinessContext(supabase);
      } catch (e) {
        console.error("Failed to fetch business context:", e);
        dataContext = "\n[Could not fetch live data]\n";
      }
    }

    const systemPrompt = `You are a helpful AI assistant for Tibrewal & Tibrewal Private Limited, a mining and logistics company in Jharkhand, India established in 2021. The company operates stone crushing, a fleet of 50+ trucks, a Bharat Petroleum fuel station, and Tibrewal Tyres. Proprietor: Trishav Tibrewal.

You help the management team with:
- Staff management, attendance tracking, and salary queries
- Vehicle fleet and logistics operations  
- Crusher operations, fuel analysis, and production
- Petroleum sales and tyre business
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
