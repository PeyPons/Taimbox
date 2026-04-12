// supabase/functions/invite-user-to-agency/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { sendWelcomeOrInvitationEmail } from "../_shared/welcome-and-invitation-email.ts"

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

    const { email, agencyId, role, department, inviterUserId } = body

    if (!email || typeof email !== 'string' || !email.trim()) {
      throw new Error('El email es obligatorio y debe ser una cadena de texto válida')
    }

    if (!agencyId || typeof agencyId !== 'string') {
      throw new Error('El ID de agencia es obligatorio')
    }

    if (!inviterUserId || typeof inviterUserId !== 'string') {
      throw new Error('El ID del usuario que invita es obligatorio')
    }

    const cleanEmail = email.trim().toLowerCase()
    console.log(`Intentando invitar usuario: ${cleanEmail} a agencia: ${agencyId}`)

    // 5. Verificar que el usuario que invita sea admin de la agencia
    const { data: inviterEmployee, error: inviterError } = await supabaseAdmin
      .from('employees')
      .select('id, role, agency_id')
      .eq('user_id', inviterUserId)
      .eq('agency_id', agencyId)
      .maybeSingle()

    if (inviterError) {
      console.error('Error verificando inviter:', inviterError)
      throw new Error('Error al verificar permisos del invitador')
    }

    if (!inviterEmployee) {
      throw new Error('No tienes permisos para invitar usuarios a esta agencia')
    }

    // Verificar que el inviter tenga permisos de admin (verificar en user_agencies o en employees.role)
    // Por ahora, verificamos que tenga un rol que contenga keywords de admin
    const MANAGER_KEYWORDS = ['manager', 'admin', 'director', 'ceo', 'founder', 'head', 'lead', 'responsable', 'coordinador']
    const inviterRole = inviterEmployee.role || ''
    const isInviterAdmin = MANAGER_KEYWORDS.some(k => inviterRole.toLowerCase().includes(k))

    // También verificar en user_agencies si existe
    const { data: inviterUserAgency } = await supabaseAdmin
      .from('user_agencies')
      .select('role')
      .eq('user_id', inviterUserId)
      .eq('agency_id', agencyId)
      .maybeSingle()

    const finalIsAdmin = isInviterAdmin ||
      (inviterUserAgency?.role && MANAGER_KEYWORDS.some(k => inviterUserAgency.role.toLowerCase().includes(k)))

    if (!finalIsAdmin) {
      throw new Error('Solo los administradores pueden invitar usuarios a la agencia')
    }

    // 6. Verificar que el email no esté ya en la agencia (por email Y agency_id)
    // Con la nueva restricción única compuesta, esto verifica duplicados en la misma agencia
    const { data: existingEmployeeInAgency } = await supabaseAdmin
      .from('employees')
      .select('id, email, user_id')
      .eq('email', cleanEmail)
      .eq('agency_id', agencyId)
      .maybeSingle()

    if (existingEmployeeInAgency) {
      // Si existe, verificar si es el mismo usuario
      if (existingEmployeeInAgency.user_id) {
        // Ya está vinculado, lanzar error
        throw new Error('Este usuario ya está vinculado a esta agencia')
      }
      // Si no tiene user_id, puede ser un empleado huérfano, continuar
    }

    // 7. Verificar si el usuario ya existe en el sistema (por email)
    // Buscar cualquier empleado con este email (puede estar en otra agencia)
    const { data: existingUserByEmail } = await supabaseAdmin
      .from('employees')
      .select('id, email, user_id, agency_id')
      .eq('email', cleanEmail)
      .limit(1)
      .maybeSingle()

    let userId: string | null = null
    let employeeId: string | null = null

    if (existingUserByEmail) {
      // Usuario existe en otra agencia o sin agencia
      userId = existingUserByEmail.user_id || null
      employeeId = existingUserByEmail.id

      // Verificar si ya tiene relación con esta agencia en user_agencies
      // Si está en user_agencies pero no tiene empleado, crear el empleado
      if (userId) {
        const { data: existingRelation } = await supabaseAdmin
          .from('user_agencies')
          .select('id, role, department')
          .eq('user_id', userId)
          .eq('agency_id', agencyId)
          .maybeSingle()

        if (existingRelation) {
          // Verificar si tiene empleado en esta agencia
          const { data: existingEmployeeInAgency } = await supabaseAdmin
            .from('employees')
            .select('id')
            .eq('user_id', userId)
            .eq('agency_id', agencyId)
            .maybeSingle()

          if (existingEmployeeInAgency) {
            // Ya tiene empleado, está completamente vinculado
            throw new Error('Este usuario ya está vinculado a esta agencia')
          }
          // Si no tiene empleado pero está en user_agencies, continuar para crear el empleado
          // Usar el rol y departamento de user_agencies si no se proporcionaron nuevos
          if (!role && existingRelation.role) {
            role = existingRelation.role
          }
          if (!department && existingRelation.department) {
            department = existingRelation.department
          }
        }
      }

      // Si el empleado existe pero no tiene user_id, crear usuario en Auth
      if (!userId) {
        // Generar contraseña temporal
        const tempPassword = Math.random().toString(36).slice(-12) + 'A1!'

        const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name: existingUserByEmail.email }
        })

        if (authError) {
          console.error('Error creando usuario Auth:', authError)
          throw new Error(`Error al crear cuenta de acceso: ${authError.message}`)
        }

        if (!newUser?.user?.id) {
          throw new Error('No se pudo crear el usuario. El sistema no devolvió un ID válido.')
        }

        userId = newUser.user.id

        // Actualizar employee con user_id
        const { error: updateError } = await supabaseAdmin
          .from('employees')
          .update({ user_id: userId })
          .eq('id', employeeId)

        if (updateError) {
          console.error('Error actualizando employee con user_id:', updateError)
          // Rollback: eliminar usuario de Auth
          await supabaseAdmin.auth.admin.deleteUser(userId)
          throw new Error('Error al vincular empleado con usuario')
        }
      }

      // Verificar si ya existe un empleado con este user_id en esta agencia
      // Con la nueva restricción única compuesta (email, agency_id), podemos tener
      // múltiples empleados con el mismo email en diferentes agencias
      const { data: existingEmployeeInAgency } = await supabaseAdmin
        .from('employees')
        .select('id, email, user_id')
        .eq('user_id', userId)
        .eq('agency_id', agencyId)
        .maybeSingle()

      if (existingEmployeeInAgency) {
        // Ya existe un empleado con este user_id en esta agencia
        // Solo actualizar rol, departamento y email si es necesario
        const { error: updateError } = await supabaseAdmin
          .from('employees')
          .update({
            email: cleanEmail, // Asegurar que el email esté actualizado
            role: role || null,
            department: department || null
          })
          .eq('id', existingEmployeeInAgency.id)

        if (updateError) {
          console.error('Error actualizando empleado existente:', updateError)
          throw new Error(`Error al actualizar empleado: ${updateError.message}`)
        }

        employeeId = existingEmployeeInAgency.id
      } else {
        // No existe empleado con este user_id en esta agencia, crear uno nuevo
        // Obtener datos del empleado fuente para copiar
        const { data: sourceEmployee, error: sourceError } = await supabaseAdmin
          .from('employees')
          .select('*')
          .eq('id', employeeId)
          .maybeSingle()

        if (sourceError) {
          console.error('Error obteniendo empleado fuente:', sourceError)
          throw new Error('Error al obtener datos del empleado')
        }

        if (!sourceEmployee) {
          console.error('No se encontró empleado fuente con id:', employeeId)
          throw new Error('No se encontró el empleado para crear copia')
        }

        // Crear un NUEVO empleado para esta agencia
        // Con la nueva restricción única compuesta (email, agency_id), esto funcionará
        // incluso si el email ya existe en otra agencia
        const { data: newEmployee, error: createEmployeeError } = await supabaseAdmin
          .from('employees')
          .insert({
            agency_id: agencyId,
            email: sourceEmployee.email || cleanEmail,
            name: sourceEmployee.name,
            first_name: sourceEmployee.first_name,
            last_name: sourceEmployee.last_name,
            user_id: userId,
            role: role || null,
            department: department || null,
            default_weekly_capacity: sourceEmployee.default_weekly_capacity || 40,
            work_schedule: sourceEmployee.work_schedule || { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0 },
            is_active: true,
            hourly_rate: sourceEmployee.hourly_rate || 0,
            avatar_url: sourceEmployee.avatar_url,
            crm_user_id: sourceEmployee.crm_user_id
          })
          .select()
          .single()

        if (createEmployeeError) {
          console.error('Error creando empleado para nueva agencia:', createEmployeeError)
          throw new Error(`Error al crear empleado para la agencia: ${createEmployeeError.message}`)
        }

        if (!newEmployee) {
          throw new Error('No se pudo crear el empleado. El sistema no devolvió un ID válido.')
        }

        employeeId = newEmployee.id
      }
    } else {
      // Usuario no existe, crear nuevo empleado
      // Primero crear usuario en Auth
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!'

      const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: cleanEmail }
      })

      if (authError) {
        console.error('Error creando usuario Auth:', authError)
        throw new Error(`Error al crear cuenta de acceso: ${authError.message}`)
      }

      if (!newUser?.user?.id) {
        throw new Error('No se pudo crear el usuario. El sistema no devolvió un ID válido.')
      }

      userId = newUser.user.id

      // Crear empleado
      const { data: newEmployee, error: employeeError } = await supabaseAdmin
        .from('employees')
        .insert({
          agency_id: agencyId,
          email: cleanEmail,
          name: cleanEmail.split('@')[0], // Usar parte antes del @ como nombre temporal
          user_id: userId,
          role: role || null,
          department: department || null,
          default_weekly_capacity: 40,
          work_schedule: { monday: 8, tuesday: 8, wednesday: 8, thursday: 8, friday: 8, saturday: 0, sunday: 0 },
          is_active: true,
          hourly_rate: 0
        })
        .select()
        .single()

      if (employeeError) {
        console.error('Error creando empleado:', employeeError)
        // Rollback: eliminar usuario de Auth
        await supabaseAdmin.auth.admin.deleteUser(userId)
        throw new Error(`Error al crear el empleado: ${employeeError.message}`)
      }

      employeeId = newEmployee.id
    }

    // 8. Crear relación en user_agencies (solo si no existe)
    if (userId) {
      // Verificar si ya existe la relación
      const { data: existingUserAgency } = await supabaseAdmin
        .from('user_agencies')
        .select('id')
        .eq('user_id', userId)
        .eq('agency_id', agencyId)
        .maybeSingle()

      if (!existingUserAgency) {
        // No existe, crear la relación
        const { error: userAgencyError } = await supabaseAdmin
          .from('user_agencies')
          .insert({
            user_id: userId,
            agency_id: agencyId,
            role: role || null,
            department: department || null,
            is_primary: false // No es primaria porque el usuario ya tiene otra agencia o es nuevo
          })

        if (userAgencyError) {
          // Si la tabla no existe, solo loguear
          if (userAgencyError.code !== '42P01') {
            console.warn('Error creando relación user_agencies:', userAgencyError)
            // No hacer rollback aquí porque el empleado ya fue creado/actualizado
          }
        }
      } else {
        // Ya existe, actualizar rol y departamento si se proporcionaron nuevos valores
        if (role !== undefined || department !== undefined) {
          const updateData: any = {}
          if (role !== undefined) updateData.role = role || null
          if (department !== undefined) updateData.department = department || null

          const { error: updateError } = await supabaseAdmin
            .from('user_agencies')
            .update(updateData)
            .eq('id', existingUserAgency.id)

          if (updateError && updateError.code !== '42P01') {
            console.warn('Error actualizando relación user_agencies:', updateError)
          }
        }
      }
    }

    console.log(`Usuario ${cleanEmail} invitado exitosamente a agencia ${agencyId}`)

    // 9b. Email de invitación vía Resend (misma vía que request-password-reset)
    try {
      const { data: agencyForEmail } = await supabaseAdmin
        .from('agencies')
        .select('name')
        .eq('id', agencyId)
        .single()

      let inviteeName = cleanEmail.split('@')[0]
      if (employeeId) {
        const { data: emp } = await supabaseAdmin
          .from('employees')
          .select('name')
          .eq('id', employeeId)
          .single()
        if (emp?.name) inviteeName = emp.name
      }

      const emailResult = await sendWelcomeOrInvitationEmail(supabaseAdmin, {
        email: cleanEmail,
        name: inviteeName,
        agencyName: agencyForEmail?.name || 'tu agencia',
        type: 'invitation',
      })
      if (!emailResult.success) {
        console.warn(`No se pudo enviar email de invitación a ${cleanEmail}:`, emailResult.error)
      }
    } catch (emailError) {
      console.warn(`No se pudo enviar email de invitación a ${cleanEmail}:`, emailError)
    }

    // 10. Devolver respuesta
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuario invitado correctamente',
        employeeId,
        userId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error("Error general:", error)
    const errorMessage = error?.message || 'Error desconocido al invitar usuario'

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

