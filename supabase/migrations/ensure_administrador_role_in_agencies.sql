-- Migración para asegurar que todas las agencias tengan el rol "Administrador"
-- Esta migración actualiza las agencias existentes que no tengan el rol "Administrador"
-- en su configuración de settings.roles

-- Función para actualizar una agencia individual
DO $$
DECLARE
  admin_role JSONB;
  agency_record RECORD;
  roles_array JSONB;
  has_admin BOOLEAN;
  updated_roles JSONB;
BEGIN
  -- Crear el rol "Administrador" con todos los permisos
  admin_role := jsonb_build_object(
    'name', 'Administrador',
    'permissions', jsonb_build_object(
      'can_access_planner', true,
      'can_access_projects', true,
      'can_access_clients', true,
      'can_access_team', true,
      'can_access_team_capacity', true,
      'can_access_reports', true,
      'can_access_client_reports', true,
      'can_access_google_ads', true,
      'can_access_meta_ads', true,
      'can_access_ads_reports', true,
      'can_access_deadlines', true,
      'can_access_okrs', true,
      'can_access_weekly_forecast', true,
      'can_access_weekly', true,
      'can_access_settings', true,
      'can_access_agency_settings', true
    )
  );

  -- Iterar sobre todas las agencias
  FOR agency_record IN SELECT id, settings FROM agencies LOOP
    roles_array := COALESCE(agency_record.settings->'roles', '[]'::jsonb);
    has_admin := false;
    
    -- Verificar si el rol "Administrador" ya existe
    SELECT EXISTS (
      SELECT 1 
      FROM jsonb_array_elements(roles_array) AS role_elem
      WHERE (role_elem->>'name') = 'Administrador'
         OR (role_elem::text = '"Administrador"')
    ) INTO has_admin;
    
    IF NOT has_admin THEN
      -- Agregar el rol "Administrador" al inicio del array
      updated_roles := jsonb_build_array(admin_role) || roles_array;
      UPDATE agencies
      SET settings = jsonb_set(
        COALESCE(settings, '{}'::jsonb),
        '{roles}',
        updated_roles
      )
      WHERE id = agency_record.id;
    ELSE
      -- Si existe, asegurar que tenga todos los permisos correctos
      updated_roles := (
        SELECT jsonb_agg(
          CASE 
            WHEN (role_elem->>'name') = 'Administrador' 
              OR (role_elem::text = '"Administrador"')
            THEN admin_role
            ELSE role_elem
          END
        )
        FROM jsonb_array_elements(roles_array) AS role_elem
      );
      
      UPDATE agencies
      SET settings = jsonb_set(
        COALESCE(settings, '{}'::jsonb),
        '{roles}',
        updated_roles
      )
      WHERE id = agency_record.id;
    END IF;
  END LOOP;
END $$;

