-- Eliminar duplicados conservando solo la fila más reciente por (account_id, agency_id, platform)
DELETE FROM ad_accounts_config a
USING ad_accounts_config b
WHERE a.id < b.id
  AND a.account_id = b.account_id
  AND a.agency_id  = b.agency_id
  AND a.platform   = b.platform;

-- Unique constraint para upsert por cuenta+agencia+plataforma
ALTER TABLE ad_accounts_config
  ADD CONSTRAINT ad_accounts_config_account_agency_platform_uq
  UNIQUE (account_id, agency_id, platform);
