/**
 * Redis 读写（Express 与 Vercel Serverless 共用）
 */
const Redis = require('ioredis');

let redisClient = null;

function getRedis() {
  if (redisClient) return redisClient;
  const url = process.env.REDIS_URL;
  if (!url || String(url).trim() === '') {
    throw new Error('REDIS_URL is not set');
  }
  const u = String(url).trim().replace(/^["']|["']$/g, '');
  const opts = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 10000,
  };
  if (u.startsWith('rediss://')) opts.tls = {};
  redisClient = new Redis(u, opts);
  return redisClient;
}

/** 供 Vercel 诊断：能否连上 Redis */
async function redisPing() {
  try {
    const r = getRedis();
    const p = await r.ping();
    return { ok: p === 'PONG', detail: p };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

function redisKeyBookings(user) {
  return `kkcam:bookings:${user}`;
}

function redisKeyFull(user) {
  return `kkcam:full:v2:${user}`;
}

async function readBookings(user) {
  const r = getRedis();
  const raw = await r.get(redisKeyBookings(user));
  if (raw == null) return [];
  const bookings = JSON.parse(raw);
  return Array.isArray(bookings) ? bookings : null;
}

async function writeBookings(user, bookings) {
  const r = getRedis();
  await r.set(redisKeyBookings(user), JSON.stringify(bookings));
}

async function readFullPayload(user) {
  const r = getRedis();
  const raw = await r.get(redisKeyFull(user));
  if (raw == null) return null;
  const payload = JSON.parse(raw);
  return payload && typeof payload === 'object' ? payload : null;
}

async function writeFullPayload(user, payload) {
  const r = getRedis();
  await r.set(redisKeyFull(user), JSON.stringify(payload));
}

module.exports = {
  getRedis,
  redisPing,
  redisKeyBookings,
  redisKeyFull,
  readBookings,
  writeBookings,
  readFullPayload,
  writeFullPayload,
};
