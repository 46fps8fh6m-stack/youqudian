/**
 * Vercel：GET /api/sync/ping — 探测 DATABASE_URL（Postgres）或 REDIS_URL
 */
const { backendKind, syncStorePing } = require('../../lib/kkcamSyncStore');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'GET only' });

  const hasDb = !!(process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim());
  const hasRedis = !!(process.env.REDIS_URL && String(process.env.REDIS_URL).trim());

  if (!hasDb && !hasRedis) {
    return res.status(200).json({
      ok: false,
      backend: 'none',
      hasDatabaseUrl: false,
      hasRedisUrl: false,
      hint: '在环境变量中设置 DATABASE_URL（推荐 Postgres）或 REDIS_URL 后 Redeploy',
    });
  }

  const ping = await syncStorePing();
  const kind = backendKind();

  return res.status(200).json({
    ok: ping.ok,
    backend: ping.backend || kind,
    hasDatabaseUrl: hasDb,
    hasRedisUrl: hasRedis,
    postgres: kind === 'postgres' ? ping.ok : undefined,
    redis: kind === 'redis' ? ping.ok : undefined,
    detail: ping.detail || null,
    error: ping.error || null,
  });
};
