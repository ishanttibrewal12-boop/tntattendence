import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-user, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify authenticated app user
    const authHeader = req.headers.get('x-app-user')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Get table sizes via pg_class
    const { data: tableSizes, error: tableError } = await supabase.rpc('get_table_sizes')

    // Get storage bucket usage
    const { data: storageData, error: storageError } = await supabase.rpc('get_storage_usage')

    // Get total DB size
    const { data: dbSize, error: dbError } = await supabase.rpc('get_database_size')

    const dbSizeRow = Array.isArray(dbSize) ? dbSize[0] : dbSize;

    return new Response(
      JSON.stringify({
        tables: tableSizes || [],
        storage: storageData || [],
        database_size: dbSizeRow || { size_pretty: '0 bytes', size_bytes: 0 },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Storage stats error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
