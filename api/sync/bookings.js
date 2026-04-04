/**
 * Vercel：GET/POST /api/sync/bookings
 */
const {
  readBookings,
  writeBookings,
} = require('../../lib/kkcamRedisSync');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const user = String(
    req.method === 'GET' ? req.query.user || '' : (req.body && req.body.user) || ''
  )
    .trim()
    .slice(0, 64);

  try {
    if (req.method === 'GET') {
      if (!user) return res.status(400).json({ ok: false, error: 'missing user' });
      const bookings = await readBookings(user);
      if (bookings === null) return res.status(500).json({ ok: false, error: 'stored data invalid' });
      return res.status(200).json({ ok: true, bookings });
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
      const u = String((body && body.user) || '').trim().slice(0, 64);
      const bookings = body && body.bookings;
      if (!u) return res.status(400).json({ ok: false, error: 'missing user' });
      if (!Array.isArray(bookings)) return res.status(400).json({ ok: false, error: 'bookings must be array' });
      await writeBookings(u, bookings);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ ok: false, error: 'method not allowed' });
  } catch (e) {
    console.error('[vercel sync bookings]', e);
    return res.status(500).json({ ok: false, error: e.message || 'redis error' });
  }
};
