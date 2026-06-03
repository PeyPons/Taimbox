# Runbook: backups y recuperación (self-hosted)

Objetivos publicados en web/legal tras implementación operativa:

| Métrica | Objetivo inicial (Pi self-hosted) |
|---------|-----------------------------------|
| **RPO** | 24 h (backup diario) |
| **RTO** | 8 h (restore manual verificado) |

## Backup diario (servidor `192.168.1.131`, usuario `alex`, puerto SSH `6561`)

1. Volcado Postgres desde el host Supabase (ajustar contenedor si cambia el nombre):

```bash
docker exec -t supabase-db pg_dump -U postgres -Fc postgres > /home/alex/backups/taimbox-$(date +%Y%m%d).dump
```

2. Copiar fuera de la Raspberry (NAS, otro VPS o almacenamiento cifrado):

```bash
rsync -avz -e "ssh -p 6561" /home/alex/backups/ backup-user@backup-host:/taimbox/
```

3. Retención recomendada: 7 diarios + 4 semanales.

## Prueba de restore mensual

1. Entorno aislado o contenedor temporal.
2. `pg_restore` del último dump.
3. Registrar fecha y resultado en `memory/` o ticket interno.

## Monitor de uptime

- Uptime Kuma (o similar) contra `https://taimbox.com` y health de Kong/API.
- No publicar SLA 99.99% hasta infra HA gestionada.

## Referencias

- Deploy Edge Functions: [05-integraciones-automatizacion.md](./05-integraciones-automatizacion.md)
- Túnel MCP desde Windows: misma doc, sección acceso BD desde Cursor
