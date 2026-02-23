// supabase/functions/create-user/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Manejo de CORS (Preflight request)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Validar variables de entorno
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Variables de entorno faltantes:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey
      })
      throw new Error('Configuración del servidor incompleta. Contacta al administrador.')
    }

    // 3. Crear cliente de Supabase con permisos de SUPERADMIN (Service Role)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // 4. Leer y validar los datos que envía el frontend
    let body
    try {
      body = await req.json()
    } catch (parseError) {
      console.error('Error parseando JSON:', parseError)
      throw new Error('Formato de datos inválido. Verifica que los datos se envíen correctamente.')
    }

    const { email, password, name } = body

    if (!email || typeof email !== 'string' || !email.trim()) {
      throw new Error('El email es obligatorio y debe ser una cadena de texto válido')
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new Error('La contraseña es obligatoria y debe tener al menos 6 caracteres')
    }

    const cleanEmail = email.trim().toLowerCase()

    // ========================================
    // SECURITY: Verify caller is authorized
    // ========================================
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No se proporcionó token de autorización' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!anonKey) {
      console.error('SUPABASE_ANON_KEY no configurada')
      throw new Error('Configuración del servidor incompleta')
    }

    // Create a client with the caller's token to verify their identity
    const { createClient: createAnonClient } = await import("https://esm.sh/@supabase/supabase-js@2")
    const supabaseWithAuth = createAnonClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    const { data: { user: callerUser }, error: callerAuthError } = await supabaseWithAuth.auth.getUser()
    if (callerAuthError || !callerUser) {
      console.error('Error verificando token del llamante:', callerAuthError)
      return new Response(
        JSON.stringify({ error: 'Token de autorización inválido o expirado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Verify the caller has admin permissions (based on agency role settings)
    const { data: callerEmployee, error: callerEmployeeError } = await supabaseAdmin
      .from('employees')
      .select('id, role, name, agency_id')
      .eq('user_id', callerUser.id)
      .single()

    if (callerEmployeeError || !callerEmployee) {
      console.error('Llamante no encontrado en employees:', callerUser.id)
      return new Response(
        JSON.stringify({ error: 'No tienes permiso para crear usuarios. Tu cuenta no está asociada a un empleado.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Fetch agency settings to check role permissions
    const { data: agency, error: agencyError } = await supabaseAdmin
      .from('agencies')
      .select('settings')
      .eq('id', callerEmployee.agency_id)
      .single()

    if (agencyError || !agency) {
      console.error('Error obteniendo agencia:', agencyError)
      return new Response(
        JSON.stringify({ error: 'Error al verificar permisos. Agencia no encontrada.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Check if caller's role has can_access_agency_settings permission
    const roles = agency.settings?.roles || []
    const callerRole = roles.find((r: { name: string }) => r.name === callerEmployee.role)
    const hasAdminPermission = callerRole?.permissions?.can_access_agency_settings === true

    if (!hasAdminPermission) {
      console.warn(`Usuario ${callerEmployee.name} (${callerEmployee.role}) intentó crear usuario sin permisos`)
      return new Response(
        JSON.stringify({ error: 'No tienes permisos para crear nuevos usuarios. Contacta a un administrador.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    console.log(`Usuario autorizado ${callerEmployee.name} (${callerEmployee.role}) creando: ${cleanEmail}`)

    // 5. Verificar que el email no exista ya en la tabla employees
    const { data: existingEmployee } = await supabaseAdmin
      .from('employees')
      .select('id')
      .eq('email', cleanEmail)
      .single()

    if (existingEmployee) {
      throw new Error('Este email ya está registrado en Taimbox. Inicia sesión o usa otro email.')
    }

    // 6. Crear el usuario en el sistema de Auth
    const { data: user, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true, // Confirmamos el email automáticamente para que pueda entrar ya
      user_metadata: { full_name: name || cleanEmail }
    })

    if (authError) {
      console.error("Error Auth:", authError)

      // Mensajes de error más descriptivos
      if (authError.message?.includes('already registered') || authError.message?.includes('already exists')) {
        throw new Error('Este email ya está registrado. Usa otro email o inicia sesión.')
      } else if (authError.message?.includes('invalid')) {
        throw new Error('El formato del email no es válido.')
      } else {
        throw new Error(authError.message || 'Error al crear el usuario en el sistema de autenticación.')
      }
    }

    if (!user?.user?.id) {
      console.error('No se recibió user.id del sistema de Auth')
      throw new Error('No se pudo crear el usuario. El sistema no devolvió un ID válido.')
    }

    console.log(`Usuario creado exitosamente: ${user.user.id}`)

    // 7. Devolver el ID del usuario creado al frontend
    return new Response(
      JSON.stringify({ user: user.user }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error("Error general:", error)
    const errorMessage = error?.message || 'Error desconocido al crear usuario'

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
