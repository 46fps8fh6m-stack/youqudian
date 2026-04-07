/**
 * 同步存储门面：若设置 DATABASE_URL 则用 PostgreSQL，否则用 REDIS_URL（Redis）。
 * 部署时二选一即可；优先 Postgres，便于长期归档与查询。
 */

function backendKind() {
  if (String(process.env.DATABASE_URL || '').trim()) return 'postgres';
  if (String(process.env.REDIS_URL || '').trim()) return 'redis';
  return '';
}

async function readFullPayload(user) {
  const k = backendKind();
  if (k === 'postgres') return require('./kkcamPostgresSync').readFullPayload(user);
  if (k === 'redis') return require('./kkcamRedisSync').readFullPayload(user);
  throw new Error('Neither DATABASE_URL nor REDIS_URL is set');
}

async function writeFullPayload(user, payload) {
  const k = backendKind();
  if (k === 'postgres') return require('./kkcamPostgresSync').writeFullPayload(user, payload);
  if (k === 'redis') return require('./kkcamRedisSync').writeFullPayload(user, payload);
  throw new Error('Neither DATABASE_URL nor REDIS_URL is set');
}

async function readBookings(user) {
  const k = backendKind();
  if (k === 'postgres') return require('./kkcamPostgresSync').readBookings(user);
  if (k === 'redis') return require('./kkcamRedisSync').readBookings(user);
  throw new Error('Neither DATABASE_URL nor REDIS_URL is set');
}

async function writeBookings(user, bookings) {
  const k = backendKind();
  if (k === 'postgres') return require('./kkcamPostgresSync').writeBookings(user, bookings);
  if (k === 'redis') return require('./kkcamRedisSync').writeBookings(user, bookings);
  throw new Error('Neither DATABASE_URL nor REDIS_URL is set');
}

/** 供 /api/sync/ping：探测当前后端是否可用 */
async function syncStorePing() {
  const k = backendKind();
  if (k === 'postgres') {
    const { pgPing } = require('./kkcamPostgresSync');
    const p = await pgPing();
    return { backend: 'postgres', ok: p.ok, detail: p.detail || null, error: p.error || null };
  }
  if (k === 'redis') {
    const { redisPing } = require('./kkcamRedisSync');
    const p = await redisPing();
    return { backend: 'redis', ok: p.ok, detail: p.detail || null, error: p.error || null };
  }
  return { backend: 'none', ok: false, detail: null, error: 'Neither DATABASE_URL nor REDIS_URL is set' };
}

module.exports = {
  backendKind,
  readFullPayload,
  writeFullPayload,
  readBookings,
  writeBookings,
  syncStorePing,
};
