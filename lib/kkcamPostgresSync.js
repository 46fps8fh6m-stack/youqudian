/**
 * PostgreSQL 读写：与 kkcamRedisSync 同语义，供 kkcamSyncStore 按 DATABASE_URL 选用。
 */
const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (pool) return pool;
  const url = String(process.env.DATABASE_URL || '').trim().replace(/^["']|["']$/g, '');
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  function sslOptionForUrl(u) {
    if (/sslmode=disable/i.test(u)) return undefined;
    if (/sslmode=require/i.test(u)) return { rejectUnauthorized: false };
    if (/localhost|127\.0\.0\.1/.test(u)) return undefined;
    if (/neon\.tech|supabase\.co|render\.com|pooler\.supabase/i.test(u)) return { rejectUnauthorized: false };
    return undefined;
  }

  pool = new Pool({
    connectionString: url,
    max: 8,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: sslOptionForUrl(url),
  });
  return pool;
}

async function pgPing() {
  try {
    const p = getPool();
    const r = await p.query('SELECT 1 AS ok');
    return { ok: r.rows[0] && r.rows[0].ok === 1, detail: 'SELECT 1' };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

async function readFullPayload(user) {
  const r = await getPool().query(
    'SELECT payload FROM kkcam_full_state WHERE sync_user_id = $1',
    [user]
  );
  if (!r.rows[0] || r.rows[0].payload == null) return null;
  const p = r.rows[0].payload;
  return typeof p === 'object' && p !== null ? p : null;
}

async function writeFullPayload(user, payload) {
  const v = Number(payload && payload.v) || 2;
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO kkcam_full_state (sync_user_id, payload_version, payload, updated_at)
       VALUES ($1, $2, $3::jsonb, now())
       ON CONFLICT (sync_user_id) DO UPDATE SET
         payload_version = EXCLUDED.payload_version,
         payload = EXCLUDED.payload,
         updated_at = now()`,
      [user, v, JSON.stringify(payload)]
    );
    if (payload && Array.isArray(payload.bookings)) {
      await client.query(
        `INSERT INTO kkcam_bookings_state (sync_user_id, bookings, updated_at)
         VALUES ($1, $2::jsonb, now())
         ON CONFLICT (sync_user_id) DO UPDATE SET
           bookings = EXCLUDED.bookings,
           updated_at = now()`,
        [user, JSON.stringify(payload.bookings)]
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    try {
      await client.query('ROLLBACK');
    } catch (e2) {}
    throw e;
  } finally {
    client.release();
  }
}

async function readBookings(user) {
  const r = await getPool().query('SELECT bookings FROM kkcam_bookings_state WHERE sync_user_id = $1', [user]);
  if (r.rows[0] && Array.isArray(r.rows[0].bookings)) return r.rows[0].bookings;
  const full = await readFullPayload(user);
  if (full && Array.isArray(full.bookings)) return full.bookings;
  return [];
}

async function writeBookings(user, bookings) {
  await getPool().query(
    `INSERT INTO kkcam_bookings_state (sync_user_id, bookings, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (sync_user_id) DO UPDATE SET
       bookings = EXCLUDED.bookings,
       updated_at = now()`,
    [user, JSON.stringify(bookings)]
  );
}

module.exports = {
  getPool,
  pgPing,
  readFullPayload,
  writeFullPayload,
  readBookings,
  writeBookings,
};
