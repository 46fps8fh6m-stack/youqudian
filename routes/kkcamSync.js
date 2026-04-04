/**
 * Express 路由：/api/sync/*
 */
const express = require('express');
const {
  readBookings,
  writeBookings,
  readFullPayload,
  writeFullPayload,
} = require('../lib/kkcamRedisSync');

const router = express.Router();

function normUser(req) {
  return String((req.query && req.query.user) || (req.body && req.body.user) || '').trim().slice(0, 64);
}

router.get('/bookings', async (req, res) => {
  const user = normUser(req);
  if (!user) return res.status(400).json({ ok: false, error: 'missing user' });
  try {
    const bookings = await readBookings(user);
    if (bookings === null) return res.status(500).json({ ok: false, error: 'stored data invalid' });
    return res.json({ ok: true, bookings });
  } catch (e) {
    console.error('[sync GET bookings]', e);
    return res.status(500).json({ ok: false, error: e.message || 'redis error' });
  }
});

router.post('/bookings', async (req, res) => {
  const user = normUser(req);
  const { bookings } = req.body || {};
  if (!user) return res.status(400).json({ ok: false, error: 'missing user' });
  if (!Array.isArray(bookings)) return res.status(400).json({ ok: false, error: 'bookings must be array' });
  try {
    await writeBookings(user, bookings);
    return res.json({ ok: true });
  } catch (e) {
    console.error('[sync POST bookings]', e);
    return res.status(500).json({ ok: false, error: e.message || 'redis error' });
  }
});

router.get('/full', async (req, res) => {
  const user = String(req.query.user || '').trim().slice(0, 64);
  if (!user) return res.status(400).json({ ok: false, error: 'missing user' });
  try {
    const payload = await readFullPayload(user);
    return res.json({ ok: true, payload: payload || null });
  } catch (e) {
    console.error('[sync GET full]', e);
    return res.status(500).json({ ok: false, error: e.message || 'redis error' });
  }
});

router.post('/full', async (req, res) => {
  const user = String((req.body && req.body.user) || '').trim().slice(0, 64);
  const payload = req.body && req.body.payload;
  if (!user) return res.status(400).json({ ok: false, error: 'missing user' });
  if (payload == null || typeof payload !== 'object' || Array.isArray(payload)) {
    return res.status(400).json({ ok: false, error: 'payload must be object' });
  }
  try {
    await writeFullPayload(user, payload);
    return res.json({ ok: true });
  } catch (e) {
    console.error('[sync POST full]', e);
    return res.status(500).json({ ok: false, error: e.message || 'redis error' });
  }
});

module.exports = router;
