// supabase/functions/register-agency/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generar slug a partir del nombre de la empresa
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
        .replace(/[^a-z0-9\s-]/g, '') // Solo alfanuméricos
        .replace(/\s+/g, '-') // Espacios a guiones
        .replace(/-+/g, '-') // Múltiples guiones a uno
        .trim();
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
            throw new Error('Configuración del servidor incompleta.')
        }

        // 3. Cliente con permisos de admin
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // 4. Leer datos
        let body
        try {
            body = await req.json()
        } catch {
            throw new Error('Formato de datos inválido.')
        }

        const { email, password, name, agencyName } = body

        // Validaciones
        if (!email || typeof email !== 'string' || !email.trim()) {
            throw new Error('El email es obligatorio')
        }

        if (!password || typeof password !== 'string' || password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres')
        }

        if (!agencyName || typeof agencyName !== 'string' || !agencyName.trim()) {
            throw new Error('El nombre de la empresa es obligatorio')
        }

        const cleanEmail = email.trim().toLowerCase()
        const cleanName = name.trim()
        const cleanAgencyName = agencyName.trim()

        console.log(`Registrando: ${cleanEmail} para agencia "${cleanAgencyName}"`)

        // 5. Verificar que el email no exista ya
        const { data: existingEmployee, error: checkError } = await supabaseAdmin
            .from('employees')
            .select('id')
            .eq('email', cleanEmail)
            .maybeSingle()

        // Si hay un error que no sea "no encontrado", lanzarlo
        if (checkError && checkError.code !== 'PGRST116') {
            console.error("Error verificando email:", checkError)
            throw new Error('Error al verificar el email. Inténtalo de nuevo.')
        }

        if (existingEmployee) {
            throw new Error('Este email ya está registrado en Taimbox. Inicia sesión o usa otro email.')
        }

        // 6. Crear usuario en Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password: password,
            email_confirm: true,
            user_metadata: { full_name: cleanName }
        })

        if (authError) {
            console.error("Error Auth:", authError)
            if (authError.message?.includes('already registered') || authError.message?.includes('already exists')) {
                throw new Error('Este email ya está registrado. Inicia sesión o usa otro email.')
            }
            throw new Error(authError.message || 'Error al crear cuenta de acceso.')
        }

        if (!authData?.user?.id) {
            throw new Error('No se pudo crear el usuario.')
        }

        const userId = authData.user.id
        console.log(`Usuario Auth creado: ${userId}`)

        // 7. Crear agencia
        let slug = generateSlug(cleanAgencyName)
        let finalSlug = slug
        let attempt = 0
        const maxAttempts = 5

        // Intentar encontrar un slug único
        while (attempt < maxAttempts) {
            const { data: existingAgency, error: slugCheckError } = await supabaseAdmin
                .from('agencies')
                .select('id')
                .eq('slug', finalSlug)
                .maybeSingle()

            // Si hay un error que no sea "no encontrado", lanzarlo
            if (slugCheckError && slugCheckError.code !== 'PGRST116') {
                console.error("Error verificando slug:", slugCheckError)
                throw new Error('Error al verificar el slug. Inténtalo de nuevo.')
            }

            if (!existingAgency) {
                break // Slug disponible
            }

            // Si existe, probar con sufijo numérico aleatorio corto
            attempt++
            finalSlug = `${slug}-${Math.floor(100 + Math.random() * 900)}`
        }

        const { data: agencyData, error: agencyError } = await supabaseAdmin
            .from('agencies')
            .insert({
                name: cleanAgencyName,
                slug: finalSlug,
                settings: {
                    // Módulos por defecto (nombres genéricos)
                    modules: {
                        projects: true, // Antes seo/ppc
                        weeklyFeedback: true,
                        professionalGoals: true,
                        deadlines: true
                    },
                    // Filtros vacíos por defecto
                    projectFilters: [],
                    // Roles: crear automáticamente el rol "Administrador" con todos los permisos
                    roles: [{
                        name: 'Administrador',
                        permissions: {
                            can_access_planner: true,
                            can_access_projects: true,
                            can_access_clients: true,
                            can_access_team: true,
                            can_access_team_capacity: true,
                            can_access_reports: true,
                            can_access_client_reports: true,
                            can_access_google_ads: true,
                            can_access_meta_ads: true,
                            can_access_ads_reports: true,
                            can_access_deadlines: true,
                            can_access_okrs: true,
                            can_access_weekly_forecast: true,
                            can_access_weekly: true,
                            can_access_settings: true,
                            can_access_agency_settings: true
                        }
                    }],
                    departments: [],
                    branding: {},
                    features: {},
                    integrations: {} // Objeto para claves API
                },
                setup_completed: false,
                plan_id: 'business',
                subscription_status: 'trialing',
                trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                trial_used_at: new Date().toISOString()
            })
            .select()
            .single()

        if (agencyError) {
            console.error("Error creando agencia:", agencyError)
            // Rollback: eliminar usuario de Auth
            await supabaseAdmin.auth.admin.deleteUser(userId)

            if (agencyError.code === '23505' && agencyError.message?.includes('agencies_name_unique')) {
                throw new Error('El nombre de la empresa ya existe. Por favor elige otro.')
            }

            throw new Error('Error al crear la empresa. Inténtalo de nuevo.')
        }

        console.log(`Agencia creada: ${agencyData.id}`)

        // 8. Crear empleado admin vinculado
        // Asignar automáticamente el rol "Administrador" que se creó en los settings
        const adminRole = 'Administrador'; // Rol fijo que siempre existe
        const temporaryDepartment = 'General'; // Departamento temporal - se actualizará en el onboarding

        const { data: employeeData, error: employeeError } = await supabaseAdmin
            .from('employees')
            .insert({
                agency_id: agencyData.id,
                name: cleanName,
                email: cleanEmail,
                user_id: userId,
                role: adminRole,
                department: temporaryDepartment,
                default_weekly_capacity: 40,
                work_schedule: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0 },
                is_active: true,
                hourly_rate: 0
            })
            .select()
            .single()

        if (employeeError) {
            console.error("Error creando empleado:", employeeError)
            // Rollback
            await supabaseAdmin.from('agencies').delete().eq('id', agencyData.id)
            await supabaseAdmin.auth.admin.deleteUser(userId)
            throw new Error('Error al crear el perfil. Inténtalo de nuevo.')
        }

        console.log(`Empleado creado: ${employeeData.id}`)

        // 9. Crear relación en user_agencies (nuevo sistema de múltiples agencias)
        // Verificar si la tabla existe antes de insertar
        const { error: userAgencyError } = await supabaseAdmin
            .from('user_agencies')
            .insert({
                user_id: userId,
                agency_id: agencyData.id,
                role: adminRole,
                department: temporaryDepartment,
                is_primary: true // Primera agencia = primaria
            })

        if (userAgencyError) {
            // Si la tabla no existe aún, solo loguear el error pero no fallar
            // Esto permite compatibilidad con instalaciones que aún no tienen la migración
            console.warn("Error creando relación user_agencies (puede que la tabla no exista aún):", userAgencyError)
            // No hacemos rollback porque el sistema antiguo sigue funcionando
        } else {
            console.log(`Relación user_agencies creada para usuario ${userId} y agencia ${agencyData.id}`)
        }

        // 9. Retornar datos para auto-login
        return new Response(
            JSON.stringify({
                success: true,
                user: authData.user,
                agency: agencyData,
                employee: employeeData
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error: any) {
        console.error("Error general:", error)
        console.error("Error stack:", error?.stack)
        console.error("Error details:", JSON.stringify(error, null, 2))

        const errorMessage = error?.message || error?.toString() || 'Error desconocido al registrar'

        return new Response(
            JSON.stringify({
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
