# Issues

> Dev 窗唯一取任务处。PM 维护，Dev 取 → 改状态 → 移交 QA → QA 关闭。

## 状态约定

- `待开发` — PM 已写完成功标准，Dev 可取
- `开发中` — Dev 取走（注明窗口名）
- `待 QA` — Dev 完成 commit，等 QA 验
- `已关闭` — QA 通过，commit tag 打上
- `PM-待确认` — Dev 发现需求不清，PM 处理
- `PM-冲突` — Dev 发现 spec 矛盾，PM 裁决

## 优先级

- **P0** — 阻塞当前里程碑，不做则 M 无法完成
- **P1** — 影响主线体验
- **P2** — 优化/边缘

---

## M0 · 基建（当前进行）

| ID | 标题 | 优先级 | 状态 | 成功标准 |
|---|---|---|---|---|
| M0-001 | 后端 NestJS 空骨架 | P0 | 已关闭 | `npm run start:dev` 启动；GET /health 返回 200；TypeScript 编译无 error — **Dev 已完成** commit `065f87e` 分支 `feature/m0-server/M0-001`；QA 步骤：`cd server && npm install && npm run start:dev` → 另开窗 `curl -i http://localhost:3000/health` 期望 `HTTP 200` + `{"status":"ok"}`；`npm run build` 退 0 — **✅ QA 通过见下方验收证据，tag `v0.0.1`** |
| M0-002 | PostgreSQL 11 张表迁移脚本 | P0 | 待开发 | 按 [02-技术架构.md 第三节](./02-技术架构.md) 11 张表全部创建；外键/索引/约束（含 data_shares 唯一约束）正确；`npm run migrate` 幂等 |
| M0-003 | 小程序空壳 + 微信开发者工具能预览 | P0 | 待开发 | 微信开发者工具导入 `miniprogram/`，能预览首页空白页；底部 tab 4 个（称重/打卡/汇总/我的）占位 |
| M0-004 | .env.example 已就位，启动检查必填项 | P0 | 待开发 | 缺关键 env（DATABASE_URL/JWT_SECRET）启动报错给出明确提示 |
| M0-005 | CI 轻体词表扫描脚本 | P1 | 待开发 | scripts/check-compliance.sh 扫 miniprogram/**/*.{wxml,js} 命中 "减脂/减肥/瘦/燃脂/塑形" 退出码非 0 |
| M0-006 | CI 密钥扫描 | P1 | 待开发 | scripts/check-secrets.sh 扫 .env* 与已 commit 文件中的明文 token/secret 模式 |
| M0-007 | Git 远程推通 | P0 | 已关闭 | 推到 Chester 提供的 GitHub 私有仓库 main 分支 — **PM 在骨架阶段完成（commit `50f34c0`，2026-06-28，远程 `ssh://git@github.com/shz910411/Mysmie-.git`）** |

**M0 完成判据**：以上 7 条全部 QA 通过；空骨架能跑；DB 11 表存在；小程序空壳能预览；推到远程。

### QA 验收证据 · M0-001（2026-06-28，QA 窗，tag `v0.0.1`）

环境：node v22.22.0 / npm 10.9.4，分支 `feature/m0-server/M0-001`。

| 项 | 命令 | 结果 |
|---|---|---|
| A 编译 | `npm run build` | 退出码 0；watch 编译「Found 0 errors」 |
| B 启动 | `npm run start:dev` | 「Nest application successfully started」，监听 :3000 |
| C /health | `curl -i :3000/health` | `HTTP/1.1 200 OK` + `Content-Type: application/json` + body 精确 `{"status":"ok"}` |
| D 真路由 | `curl -i :3000/nope` | `HTTP/1.1 404 Not Found`（证明真路由，非裸 listen 全返 200） |
| E 端口可配 | `PORT=3001 node dist/main.js` | :3001/health 返 200，:3000 不受影响 |
| F 收尾 | `lsof -iTCP:3000` | 无残留监听，进程清干净 |
| G 迈思美三维度 | — | N/A：纯后端骨架无可见界面，待 M0-003 小程序壳再查 |

结论：**5 项硬指标全过 → 已关闭**。真起服务 + 真 curl 真实 200 + 真 tsc build 退 0，无 mock、无 node --check 自检。

---

## M1 · 登录建档（待 M0 全过后开启）

| ID | 标题 | 优先级 | 状态 |
|---|---|---|---|
| M1-001 | 后端 auth 模块（POST /auth/login code2Session）| P0 | 待开发 |
| M1-002 | 后端 auth 模块（POST /auth/phone 解密手机号）| P0 | 待开发 |
| M1-003 | 后端 users 模块（GET/PUT /me/profile 轻建档）| P0 | 待开发 |
| M1-004 | 后端 consent 模块（POST/DELETE /me/consents 带版本）| P0 | 待开发 |
| M1-005 | 小程序 S1 登录页（微信授权 + 手机号原生组件）| P0 | 待开发 |
| M1-006 | 小程序 S2 双层同意页（健康数据独立非默认勾选）| P0 | 待开发 |
| M1-007 | 小程序 S3 轻建档页（性别/年龄/身高 1 屏）| P0 | 待开发 |
| M1-008 | 全局守卫：未同意健康数据则记录功能锁定 | P0 | 待开发 |

**M1 完成判据**：新用户 ≤3 步进首页；同意带版本入库；拒绝健康同意则称重/打卡入口锁定（点击友好提示）。

---

## M2-M9 · 待 M1 通过后由 PM 拆出 Issue

> PM 当前只先拆 M0+M1。Dev 窗跑通 M0 后 PM 立即拆 M1 完整 Issue；M1 完成后再拆 M2，避免一次性拆太多失去机动空间（视频 03"小步迭代"建议）。
