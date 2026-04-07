/**
 * Vercel：GET/POST /api/sync/full
 */
const { readFullPayload, writeFullPayload } = require('../../lib/kkcamSyncStore');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const user = String(req.query.user || '')
        .trim()
        .slice(0, 64);
      if (!user) return res.status(400).json({ ok: false, error: 'missing user' });
      const payload = await readFullPayload(user);
      return res.status(200).json({ ok: true, payload: payload || null });
    }
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body || '{}');
        } catch (e) {
          return res.status(400).json({ ok: false, error: 'invalid json' });
        }
      }
      const user = String((body && body.user) || '')
        .trim()
        .slice(0, 64);
      const payload = body && body.payload;
      if (!user) return res.status(400).json({ ok: false, error: 'missing user' });
      if (payload == null || typeof payload !== 'object' || Array.isArray(payload)) {
        return res.status(400).json({ ok: false, error: 'payload must be object' });
      }
      await writeFullPayload(user, payload);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ ok: false, error: 'method not allowed' });
  } catch (e) {
    console.error('[vercel sync full]', e);
    return res.status(500).json({ ok: false, error: e.message || 'sync store error' });
  }
};
