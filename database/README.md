# 数据库（PostgreSQL）

与网站 `/api/sync/full`、`/api/sync/bookings` 写入的同一份业务数据，按「同步槽位」`sync_user_id` 存表。

## 一键本地起库 + 建表

```bash
chmod +x database/bootstrap.sh   # 仅需一次
npm run db:bootstrap
```

然后在项目根目录 `.env` 增加：

```env
DATABASE_URL=postgresql://kkcam:kkcam_local_dev@127.0.0.1:5432/kkcam
```

再 `npm run dev`。服务端会**优先使用 `DATABASE_URL`**（未设置时才用 `REDIS_URL`）。

## 云端（Neon / Supabase / RDS）

1. 新建 Postgres 数据库。
2. 在控制台执行 `database/schema.sql` 全文。
3. 把连接串填到 Vercel **Environment Variables** 的 `DATABASE_URL`（通常需带 `?sslmode=require`）。
4. Redeploy。可移除 `REDIS_URL`，仅保留 Postgres。

## 表说明

| 表 | 用途 |
|----|------|
| `kkcam_full_state` | 全量 JSON：`cameras`、`bookings`、`splitMode`、`stationPage`、`sharedFund`、`transferRequests`、`feePresets`、`calcFeeCity` 等 |
| `kkcam_bookings_state` | 订单数组镜像，兼容旧版仅拉账单接口 |
