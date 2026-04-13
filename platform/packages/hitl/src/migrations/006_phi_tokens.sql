-- =============================================================================
-- 006_phi_tokens.sql
-- Reversible PHI token store — Wave 1 deploy (SNF-104).
--
-- Backs the PostgresTokenStore in connectors/src/gateway/redaction.ts.
-- Every PHI string leaving the gateway is replaced with a token like
-- [NAME_0042]. This table stores the reverse mapping so that
-- snf_action__execute_approved_action can re-identify in-VPC.
-- =============================================================================

CREATE TABLE phi_tokens (
  token        TEXT PRIMARY KEY,
  kind         TEXT NOT NULL,
  original     TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (kind, original)
);
