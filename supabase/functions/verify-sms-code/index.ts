import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { phone, code, purpose } = await req.json()

    if (!phone || !code || !purpose) {
      return new Response(
        JSON.stringify({ error: 'phone, code et purpose requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Hash du code fourni
    const encoder = new TextEncoder()
    const data = encoder.encode(code)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const codeHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Vérifier le code en base
    const { data: record, error } = await supabaseAdmin
      .from('sms_verification_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code_hash', codeHash)
      .eq('purpose', purpose)
      .is('verified_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !record) {
      // Incrémenter les tentatives
      await supabaseAdmin
        .from('sms_verification_codes')
        .update({ attempts: supabaseAdmin.rpc('increment_attempts') })
        .eq('phone', phone)
        .eq('purpose', purpose)
        .is('verified_at', null)

      return new Response(
        JSON.stringify({ valid: false, error: 'Code invalide ou expiré' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Marquer comme vérifié
    await supabaseAdmin
      .from('sms_verification_codes')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', record.id)

    return new Response(
      JSON.stringify({ valid: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erreur inconnue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
