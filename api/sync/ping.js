/**
 * Vercel：GET /api/sync/ping — 诊断 Serverless 与 REDIS_URL（不读写业务数据）
 */
const { redisPing } = require('../../lib/kkcamRedisSync');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'GET only' });

  const hasUrl = !!(process.env.REDIS_URL && String(process.env.REDIS_URL).trim());
  if (!hasUrl) {
    return res.status(200).json({
      ok: false,
      hasRedisUrl: false,
      hint: '在 Vercel 项目 Environment Variables 中添加 REDIS_URL 并 Redeploy',
    });
  }
  const ping = await redisPing();
  return res.status(200).json({
    ok: ping.ok,
    hasRedisUrl: true,
    redis: ping.ok,
    detail: ping.detail || null,
    error: ping.error || null,
  });
};
