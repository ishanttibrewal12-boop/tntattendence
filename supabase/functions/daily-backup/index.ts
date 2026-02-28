import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const tables = [
      'staff', 'attendance', 'advances', 'payroll',
      'mlt_staff', 'mlt_attendance', 'mlt_advances',
      'petroleum_sales', 'petroleum_payments',
      'reminders', 'app_settings',
      'credit_parties', 'credit_party_transactions',
      'tyre_sales', 'dispatch_reports', 'bolder_reports',
      'mlt_services', 'mlt_fuel_reports', 'salary_records', 'daily_photos',
    ]

    const data: Record<string, unknown[]> = {}

    // Fetch all tables in parallel
    const results = await Promise.all(
      tables.map(async (table) => {
        const { data: rows, error } = await supabase.from(table).select('*')
        if (error) {
          console.error(`Error fetching ${table}:`, error.message)
          return { table, rows: [] }
        }
        return { table, rows: rows || [] }
      })
    )

    for (const { table, rows } of results) {
      data[table] = rows
    }

    const backupPayload = {
      version: '4.0-auto',
      created_at: new Date().toISOString(),
      data,
    }

    const jsonString = JSON.stringify(backupPayload)
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const fileName = `backup-${dateStr}.json`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('daily_backups')
      .upload(fileName, jsonString, {
        contentType: 'application/json',
        upsert: true,
      })

    if (uploadError) {
      // Log failure
      await supabase.from('backup_logs').insert({
        file_path: fileName,
        file_size: 0,
        status: 'failed',
        error_message: uploadError.message,
      })
      throw uploadError
    }

    // Log success
    await supabase.from('backup_logs').insert({
      file_path: fileName,
      file_size: jsonString.length,
      status: 'success',
    })

    // Cleanup: delete backups older than 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: oldLogs } = await supabase
      .from('backup_logs')
      .select('id, file_path')
      .lt('created_at', thirtyDaysAgo.toISOString())

    if (oldLogs && oldLogs.length > 0) {
      const filePaths = oldLogs.map((l) => l.file_path)
      await supabase.storage.from('daily_backups').remove(filePaths)

      const oldIds = oldLogs.map((l) => l.id)
      await supabase.from('backup_logs').delete().in('id', oldIds)
    }

    return new Response(
      JSON.stringify({ success: true, file: fileName, size: jsonString.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Backup error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
