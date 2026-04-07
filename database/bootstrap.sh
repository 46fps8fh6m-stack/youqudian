#!/usr/bin/env bash
# 一键：启动 Postgres 并执行 schema.sql
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f database/docker-compose.yml)
"${COMPOSE[@]}" up -d

echo "等待数据库就绪…"
for i in $(seq 1 40); do
  if "${COMPOSE[@]}" exec -T postgres pg_isready -U kkcam -d kkcam 2>/dev/null; then
    break
  fi
  sleep 1
  if [[ "$i" -eq 40 ]]; then
    echo "超时：请检查 Docker 是否运行、5432 是否被占用"
    exit 1
  fi
done

"${COMPOSE[@]}" exec -T postgres psql -U kkcam -d kkcam -v ON_ERROR_STOP=1 < database/schema.sql

echo ""
echo "已完成。本地连接串（写入项目根目录 .env）："
echo "DATABASE_URL=postgresql://kkcam:kkcam_local_dev@127.0.0.1:5432/kkcam"
echo ""
echo "启动本站（会优先走 Postgres）：npm run dev"
echo "Vercel：在 Environment Variables 添加 DATABASE_URL（可去掉 REDIS_URL 或保留作备用）"
