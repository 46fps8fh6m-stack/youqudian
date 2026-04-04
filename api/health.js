/**
 * Vercel：GET /api/health — 无依赖，仅确认函数是否部署成功
 */
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  res.status(200).json({ ok: true, kkcam: 'health', node: process.version });
};
