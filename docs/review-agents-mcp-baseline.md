# Review Agents — baseline MCP (auditoría)

Generado al implementar el plan. Ejecutar en instancia self-hosted cuando el MCP `supabase-self-hosted` esté activo.

## Comprobaciones baseline

```sql
-- Tablas review_* no deben existir antes de migrar
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'review_%';

-- employees.role para visibilidad de skills
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'role';

-- Buckets Storage previos
SELECT id, name, public FROM storage.buckets;
```

## Post-migración

```sql
SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename LIKE 'review_%';
SELECT policyname, tablename FROM pg_policies WHERE tablename LIKE 'review_%';
```

## Advisors

Tras `apply_migration`, ejecutar `get_advisors` con tipos `security` y `performance`.
