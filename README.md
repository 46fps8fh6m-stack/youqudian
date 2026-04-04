# 有趣点相机屋 · 相机租赁单页

单文件前端 `index.html` + 可选 **Redis 全站云同步**（Vercel Serverless 或本地 Express）。

---

## 重要说明：为什么配好 Redis / 更新了 Vercel，页面仍写「数据来自本机 localStorage」？

这是**正常设计**，不是没同步成功：

| 层级 | 作用 |
|------|------|
| **localStorage** | 应用**运行时**读写数据的地方；界面上的「时间段总账」等文案会写明数据来自本机 localStorage。 |
| **Redis（/api/sync）** | 用于**多设备备份与对齐**：你在网页里点「上传到云端 / 从云端拉取」时，才会和 Redis 交换**全量包**（订单、各城机身、调拨申请、公费、费率等）。 |

因此：**不会因为部署了 Vercel 或填了 REDIS_URL，就自动把界面改成「来自云端」**；跨设备要靠**同一域名 + 同一云同步昵称 + 手动或自动上传/拉取**。

---

## 目录结构（上传 GitHub 时请保持）

```
.
├── index.html          # 主应用（体积大属正常）
├── package.json        # 必填：Vercel Serverless 依赖 ioredis
├── package-lock.json   # 建议一并提交
├── manifest.json
├── app-icon.png
├── server.js           # 本地 npm start 用
├── routes/kkcamSync.js # Express 路由（本地）
├── lib/kkcamRedisSync.js
└── api/sync/
    ├── full.js         # Vercel: GET/POST /api/sync/full
    └── bookings.js     # Vercel: GET/POST /api/sync/bookings
```

- **不要**把 `node_modules/`、`/.env` 提交到 Git（已在 `.gitignore`）。
- **不要**在仓库里放真实 `REDIS_URL`；线上只在 Vercel **Environment Variables** 中配置。

---

## 本地开发

```bash
npm install
# 在项目根目录创建 .env，仅一行（勿提交）：
# REDIS_URL=redis://...
npm start
```

浏览器访问终端提示的地址（如 `http://127.0.0.1:3000`）。勿用 `file://` 打开，否则无法请求 `/api/sync`。

---

## Vercel 部署检查清单

1. **GitHub 仓库根目录** 必须包含：`index.html`、`package.json`、`api/sync/*.js`、`lib/kkcamRedisSync.js`。
2. **Settings → General → Root Directory**：若上述文件在仓库根目录，则**留空**；若在子目录，填到与 `package.json` 同级的那一层。
3. **Settings → Environment Variables**  
   - 添加 **`REDIS_URL`**（与 Vercel Redis 或 Redis 云控制台中的连接串一致）。  
   - 作用域勾选 **Production**（需要时再加 Preview）。  
   - 保存后务必 **Deployments → 最新一条 → ⋯ → Redeploy**。
4. **自定义域名**（如 `youqudian.top`）在 **Settings → Domains** 绑定到**当前项目**；日常书签请固定使用该域名，勿混用 `xxx.vercel.app`（不同域名 = 不同 localStorage）。
5. 自测接口（将 `你的昵称` 换成云同步里填的昵称）：

   `https://你的域名/api/sync/full?user=你的昵称`

   若返回 JSON 且含 `"ok":true`，说明函数与 Redis 连通。

---

## 多设备同步操作步骤

1. 所有设备使用**同一网址**（例如 `https://youqudian.top`）。
2. 登录后，在顶部 **「全站云同步」** 填写 **同步昵称**（各设备必须**完全一致**）；昵称存在本机浏览器，换设备需重新填。
3. **有数据的设备**：点击 **「上传到云端」**，或勾选 **「保存时自动上传」** 后触发一次保存。
4. **新设备**：同一昵称下点击 **「从云端拉取」**。
5. 若接口暂时不可用：使用 **「导出全量 JSON」** / **「导入全量 JSON」** 搬运数据（不依赖 Redis）。

---

## 常见问题

| 现象 | 可能原因 |
|------|----------|
| 换设备没有数据 | 未填同一昵称、未先上传、或新设备打开了 `vercel.app` 而旧设备用的是自定义域名。 |
| `/api/sync/...` 404 | 仓库缺 `package.json`、Root Directory 指错、或未包含 `api/` 与 `lib/`。 |
| GitHub 提示一次不能传超过 100 个文件 | 勿用网页批量上传整个项目；用 `git add` / `git push`，并忽略 `node_modules`。 |
| 两个 Vercel 项目连同一仓库 | 只给**绑域名**的那一个配 `REDIS_URL` 并作为正式环境；其余可归档以免混淆。 |

---

## 推送到 GitHub（示例）

```bash
cd /path/to/相机租赁
git status
git add .
git commit -m "chore: sync repo with deploy docs"
git push origin main
```

确保 `.env` 未被 `git add`（应在 `.gitignore` 中）。

---

## 安全

- 定期轮换 Redis 密码；泄露的连接串需在云平台重置。
- 云同步昵称相当于**共享口令**，请使用足够随机的字符串。

---

文档版本：与仓库内云同步逻辑（全量 `/api/sync/full` + 本地 localStorage）一致。若你改动了接口路径或环境变量名，请同步修改本文。
