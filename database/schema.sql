-- kkcam 网站全量同步落库（与 /api/sync/full、/api/sync/bookings 一致）
-- 用法：本地见 database/bootstrap.sh；云端把本文件在 Neon / Supabase / RDS 的 SQL 控制台执行一次即可。

BEGIN;

CREATE TABLE IF NOT EXISTS kkcam_full_state (
  sync_user_id    TEXT PRIMARY KEY,
  payload_version INT NOT NULL DEFAULT 2,
  payload         JSONB NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kkcam_full_state_updated
  ON kkcam_full_state (updated_at DESC);

COMMENT ON TABLE kkcam_full_state IS '每槽位一条：cameras/bookings/splitMode/station/sharedFund/transferRequests/feePresets 等整包 JSON';

CREATE TABLE IF NOT EXISTS kkcam_bookings_state (
  sync_user_id TEXT PRIMARY KEY,
  bookings     JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kkcam_bookings_state_updated
  ON kkcam_bookings_state (updated_at DESC);

COMMENT ON TABLE kkcam_bookings_state IS '与历史 Redis kkcam:bookings:* 对齐；可由全量包中的 bookings 一并更新';

COMMIT;
