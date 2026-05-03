-- Análisis de mix: tipo de proyecto y heurística multi-mes (allocations en ≥2 meses).
-- Sustituir '<tu-uuid-agencia>' por el UUID del tenant principal antes de ejecutar.
-- Solo lectura; ejecutar en staging/prod según política interna.

-- 1) Distribución de project_type en proyectos activos
SELECT
  COALESCE(NULLIF(TRIM(project_type), ''), '(vacío)') AS tipo,
  COUNT(*) AS proyectos
FROM projects
WHERE status = 'active'
  AND agency_id = '<tu-uuid-agencia>'::uuid
GROUP BY 1
ORDER BY proyectos DESC;

-- 2) Proyectos activos con actividad en ≥2 meses distintos
WITH months_per_project AS (
  SELECT
    a.project_id,
    COUNT(DISTINCT date_trunc('month', a.week_start_date::date)) AS distinct_months
  FROM allocations a
  INNER JOIN projects pr ON pr.id = a.project_id
    AND pr.agency_id = '<tu-uuid-agencia>'::uuid
  GROUP BY a.project_id
)
SELECT
  COALESCE(NULLIF(TRIM(p.project_type), ''), '(vacío)') AS tipo,
  COUNT(*) AS proyectos_multi_mes
FROM projects p
INNER JOIN months_per_project m ON m.project_id = p.id AND m.distinct_months >= 2
WHERE p.status = 'active'
  AND p.agency_id = '<tu-uuid-agencia>'::uuid
GROUP BY 1
ORDER BY proyectos_multi_mes DESC;

-- 3) % de activos con allocations multi-mes
WITH active AS (
  SELECT COUNT(*) AS n
  FROM projects
  WHERE status = 'active'
    AND agency_id = '<tu-uuid-agencia>'::uuid
),
multi AS (
  SELECT COUNT(DISTINCT p.id) AS n
  FROM projects p
  INNER JOIN (
    SELECT a.project_id
    FROM allocations a
    INNER JOIN projects pr ON pr.id = a.project_id
      AND pr.agency_id = '<tu-uuid-agencia>'::uuid
    GROUP BY a.project_id
    HAVING COUNT(DISTINCT date_trunc('month', a.week_start_date::date)) >= 2
  ) x ON x.project_id = p.id
  WHERE p.status = 'active'
    AND p.agency_id = '<tu-uuid-agencia>'::uuid
)
SELECT
  active.n AS activos_totales,
  multi.n AS activos_con_alloc_multi_mes,
  ROUND(100.0 * multi.n / NULLIF(active.n, 0), 1) AS pct
FROM active, multi;
