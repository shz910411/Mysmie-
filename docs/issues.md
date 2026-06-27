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
| M0-002 | PostgreSQL 表迁移脚本 | P0 | 待 QA | 按 [02-技术架构.md 第三节](./02-技术架构.md) 表全部创建；外键/索引/约束（含 data_shares 活跃唯一约束）正确；`npm run migrate` 幂等。**环境已备**（PM 2026-06-28）：本机 PostgreSQL 16 在跑，目标库=干净空库 `maisimei`（旧项目库已归档为 `maisimei_old`，**勿连**）；`DATABASE_URL=postgresql://sunchester@localhost:5432/maisimei`（本地 trust 认证无密码）。**注意**：02 文档表清单含 notifications/onboarding_tasks/shipments/media_download_logs/export_jobs，实际 >11 张，**以 02 文档为准全建，标题"11"是旧估值勿当上限** — **Dev 已完成** commit `122b21c` 分支 `feature/m0-rest`，验收证据见下方「Dev 自验·M0-002」 |
| M0-003 | 小程序空壳 + 微信开发者工具能预览 | P0 | 待 QA（待 devtools 真编译）| 微信开发者工具导入 `miniprogram/`，能预览首页空白页；底部 tab 4 个（称重/打卡/汇总/我的）占位 — **Dev 已完成代码** commit `1cdaeac` 分支 `feature/m0-rest`，证据见下方「Dev 自验·M0-003」。⚠️ **Dev 环境无法真编译，必须 QA/人工用微信开发者工具导入 `miniprogram/` 真编译确认 4 tab 可点、空白页可预览后才能关闭** |
| M0-004 | .env.example 已就位，启动检查必填项 | P0 | 待 QA | 缺关键 env（DATABASE_URL/JWT_SECRET）启动报错给出明确提示 — **Dev 已完成** commit `7d165e1` 分支 `feature/m0-rest`，证据见下方「Dev 自验·M0-004」 |
| M0-005 | CI 轻体词表扫描脚本 | P1 | 待 QA | scripts/check-compliance.sh 扫 miniprogram/**/*.{wxml,js} 命中 "减脂/减肥/瘦/燃脂/塑形" 退出码非 0 — **Dev 已完成** commit `32a5d3d` 分支 `feature/m0-rest`，证据见下方「Dev 自验·M0-005」 |
| M0-006 | CI 密钥扫描 | P1 | 待 QA | scripts/check-secrets.sh 扫 .env* 与已 commit 文件中的明文 token/secret 模式 — **Dev 已完成** commit `5c52c73` 分支 `feature/m0-rest`，证据见下方「Dev 自验·M0-006」 |
| M0-007 | Git 远程推通 | P0 | 已关闭 | 推到 Chester 提供的 GitHub 私有仓库 main 分支 — **PM 在骨架阶段完成（commit `50f34c0`，2026-06-28，远程 `ssh://git@github.com/shz910411/Mysmie-.git`）** |

**M0 完成判据**：以上 7 条全部 QA 通过；空骨架能跑；DB 全表存在；小程序空壳能预览；推到远程。

---

## 🌙 M0 余下批量开发指引（PM 2026-06-28 夜 · 自主跑 2-3 小时）

> Chester 不在场逐条确认。本节预解决了所有可预见歧义，Dev 一路跑完 M0-002→M0-006，不要停下等人。

### 范围与顺序（按此序，P0 先于 P1）
1. **M0-002** 数据库迁移（最高价值，可完全自验）
2. **M0-003** 小程序空壳（代码写完，真编译验证留给 QA/人工的微信开发者工具——见下方 caveat）
3. **M0-004** 启动 env 检查
4. **M0-005** CI 轻体词表扫描（P1）
5. **M0-006** CI 密钥扫描（P1）

### 分支与合并（本批专用，区别于平时）
- 全部在**单一分支** `feature/m0-rest`（从当前 main 切）上做，**逐 Issue 一个或多个 commit**，commit 带 Issue 号。
- 频繁 `git push`（每条 Issue 完就推），防窗口中断丢工作。
- **不要碰 main**——平时的"QA 逐条 ff 合并"在本批改为：明早 QA 批量验完整个 M0 后**一次性 ff 合 main**。这是 PM 对夜间无人值守的有意调整，非违规。

### 自主护栏（无人值守关键）
- 每条 Issue：实现 → 用真实命令自验 → 把验证证据贴进本文件对应 Issue 下方 → 状态改 `待 QA`。
- **遇到本节没覆盖的新歧义**：不要停下空等。做**最小合理假设**，在该 Issue 下写一行 `Dev 假设：……`，然后继续；明早 PM/QA 复核。（这是对夜间批量的特例——平时该停下问 PM，但无人值守时"停"=浪费整个窗口。）
- **不得越界做 M1**。M0-006 做完即停，回头复验自己的工作，等 PM 派 M1。早做完就 STOP，别找活干。
- Karpathy 4 守则照常：极简、外科手术、每行 diff 可追溯、开工前重读成功标准。

### 预解决决策（直接用，别再问）

**① 建表清单 = 19 张**（标题"11"是旧估值，作废）。以 [02-技术架构.md 第三节](./02-技术架构.md) 列定义为准，全建：
`users` `advisors` `admin_accounts` `consent_records` `weight_records` `meal_records` `meal_items` `daily_logs` `advisor_change_logs` `data_shares` `service_notes` `service_day_marks` `stage_records` `health_reports` `notifications` `onboarding_tasks` `shipments` `media_download_logs` `export_jobs`

**② 迁移工具**：你定，但**最小化**——纯 SQL 文件 + 一个 migrate 运行脚本，或 node-pg-migrate 皆可。**M0 不引入 TypeORM 实体**（那是各业务模块开发时的事）；M0 只要"表结构存在 + `npm run migrate` 可重复跑不报错（幂等）"。

**③ data_shares 活跃唯一约束**：用部分唯一索引 `UNIQUE (owner_user_id, viewer_user_id) WHERE status='active'`——允许历史 revoked 记录重复，只锁活跃关系。

**④ env 必填 vs 选填**（M0-004）：启动**硬性必填** = `DATABASE_URL` `JWT_SECRET`（缺则 fail-fast 报明确中文/英文提示并退出）；**选填只告警** = `WX_*` `OSS_*` `AI_VISION_*` `OCR_*`（这些集成在后续里程碑接，M0 缺不阻塞启动，仅 console.warn）。

**⑤ 目标数据库**：`DATABASE_URL=postgresql://sunchester@localhost:5432/maisimei`（干净空库，本地 trust 无密码）。旧库 `maisimei_old` 勿连。

**⑥ M0-003 真编译 caveat**：小程序 .wxml/.json 写完后，你**无法**用微信开发者工具真编译（环境所限）。允许的自验=app.json/page.json 用 JSON.parse 校验合法、目录结构齐全、4 个 tab 配置正确。状态改 `待 QA` 但在证据区注明「**代码就绪，待微信开发者工具真编译验证（QA/人工）**」——绝不声称已编译通过。

### 本批完成回报格式（写在最后一条 commit 或单独 commit）
逐条列 M0-002~006 的 状态 / commit hash / 自验结果 / 遗留假设，一句话总结"M0 余下批量完成，待明早 QA 批验"。

### 🌅 Dev 回报 · M0 余下批量（2026-06-28 夜完成）

分支 `feature/m0-rest`（从 main 切，10 个 commit，全部已推 origin，**未碰 main**，等明早 QA 批验后一次性 ff 合并）。各条详细证据见本文件对应「Dev 自验」块。

| Issue | 状态 | 代码 commit | 自验结果 |
|---|---|---|---|
| M0-002 数据库迁移 | 待 QA | `122b21c` | 19 表全建；`migrate` 二次跑 skip 退0（幂等）；data_shares 活跃唯一/whr 生成列/FK 拦截均实测通过 |
| M0-003 小程序空壳 | **待 QA（待 devtools 真编译）** | `1cdaeac` | 7 个 JSON 合法 + 4 页文件齐全 + 4 tab 配置一致 + 文案 0 违禁词；⚠️ **真编译 Dev 做不了，必须 QA 人工微信开发者工具确认** |
| M0-004 env 必填检查 | 待 QA | `7d165e1` | 缺 DATABASE_URL/JWT_SECRET → 退1+明确提示；完整 env → 启动+选填告警+/health 200 |
| M0-005 轻体词表扫描 | 待 QA | `32a5d3d` | 三态（干净退0/植入退1显命中/清除退0）通过 |
| M0-006 密钥扫描 | 待 QA | `5c52c73` | 六态（干净/阿里云AK/AWS/通用/.env入库/回归）全过，dev 占位不误报 |

**遗留假设汇总**（均做了最小合理决策，待 PM/QA 复核，详见各 Dev 自验块）：
- M0-002：主键 BIGSERIAL、枚举值最小集用 CHECK、补 created_at/updated_at、加 client_uuid 幂等键、invite_code 活跃唯一、复合主键(daily_logs/onboarding_tasks)、仅 meal_items 级联删、media_download_logs 拆 file_keys/date_range 两列。
- M0-003：appid 暂置 `touristappid`（真 appid 待行政）、tabBar 纯文字无图标、project.config.json 置 miniprogram/ 内。
- M0-005：词表取核心 5 词（极限词留 PM 扩）、附带扫 .json。
- M0-006：强模式覆盖私钥/AWS/阿里云/sk-/gh*_；排除 package-lock；本地 .env* 只扫强模式不扫通用赋值。

**一句话**：M0 余下批量（002–006）开发+自验全部完成，5 条均「待 QA」（其中 M0-003 真编译待人工 devtools），代码与证据已推 `feature/m0-rest`，**待明早 QA 批验**。M0-006 后即停，未越界做 M1。

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

### Dev 自验 · M0-002（2026-06-28 夜，Dev 窗，commit `122b21c`）

环境：PostgreSQL 16.14（Homebrew，trust 无密码），目标库 `maisimei`（连前确认空库），`DATABASE_URL=postgresql://sunchester@localhost:5432/maisimei`。

| 项 | 命令 | 结果 |
|---|---|---|
| A 首次迁移 | `npm run migrate` | `apply 001_init_schema.sql`，本次应用 1 个 |
| B 全表建成 | `SELECT … FROM pg_tables`（排除 `_migrations`）| **19 张业务表全部存在**（清单见下） |
| C 幂等 | `npm run migrate` 第二次 | `skip 001_init_schema.sql`，应用 0 个，退出码 0，表数仍 19 |
| D data_shares 活跃唯一 | 同 (owner,viewer) 插第二条 active | `ERROR: duplicate key … uq_data_shares_active`（被拒）✓ |
| D2 revoked 可重复 | 改 revoked 后再插 active | 成功；最终 2 行 1 活跃 ✓（历史 revoked 不挡新活跃）|
| E whr 生成列 | 腰 80 / 臀 100 → `whr`；臀 NULL → `whr` | `0.80` / `NULL` ✓ |
| F 外键拦截 | weight_records 指向不存在 user 999999 | `ERROR: violates foreign key constraint`（被拒）✓ |
| G 收尾 | `TRUNCATE … RESTART IDENTITY CASCADE` | 测试数据清空，业务表行数归 0，库复位为空 |

19 表清单：`admin_accounts advisor_change_logs advisors consent_records daily_logs data_shares export_jobs health_reports meal_items meal_records media_download_logs notifications onboarding_tasks service_day_marks service_notes shipments stage_records users weight_records`。

**Dev 假设**（指引未覆盖、做最小合理决策，待 PM/QA 复核）：
1. 主键统一 `BIGSERIAL`；枚举值（gender/status/source/ai_status/role/mark/shipments.status/export_jobs.status 等）按语义取最小集，用 `CHECK` 约束落地；如与后续业务模块需求冲突，迁移文件可加列/放宽。
2. 多数业务表补 `created_at`（02 文档仅部分列出），并给 users 补 `updated_at`——审计常用、零风险。
3. weight_records 补 `client_uuid` 幂等键列（02 文档 API 契约「POST /weights 幂等键 client_uuid」要求）+ 唯一索引 `(user_id, client_uuid)`。
4. data_shares 额外加活跃 `invite_code` 唯一索引（「邀请码 24h 单次有效」语义）。
5. `daily_logs`/`onboarding_tasks` 用复合主键（02 文档明示「user_id+X 唯一」、未列 id）。
6. FK 默认 `RESTRICT`，仅 `meal_items → meal_records` 用 `ON DELETE CASCADE`（明确父子）；注销「餐照连删」等删除级联策略留给业务模块，M0 不预设。
7. `media_download_logs` 把 02 文档「file_keys/date_range」拆为 `file_keys JSONB` + `date_range JSONB` 两列。

迁移工具：纯 SQL + `ts-node` 运行器，`_migrations` 账本表跳过已应用文件——**M0 不引入 TypeORM 实体**（符合指引②）。`.env`（含 DATABASE_URL/JWT_SECRET）本地创建且已被 `.gitignore` 拦截，未进 Git。

---

### Dev 自验 · M0-003（2026-06-28 夜，Dev 窗，commit `1cdaeac`）

⚠️ **真编译归属**：按指引⑥，Dev 环境无微信开发者工具，**无法真编译**。下表自验仅覆盖「代码就绪度」（JSON 合法 / 目录齐全 / tab 配置一致 / 文案合规），**编译可预览这一项必须 QA/人工在微信开发者工具内确认**，Dev 不声称已编译通过。

| 项 | 方法 | 结果 |
|---|---|---|
| A JSON 合法 | node `JSON.parse` 遍历 7 个 .json（app/4×page/project.config/sitemap）| 全部 OK |
| B 页面完整 | app.json `pages[]` 每页校验 .js/.json/.wxml | 4 页 × 3 文件全在 |
| C tabBar 一致 | tab 数 + 每个 pagePath ∈ pages | 4 tab；称重/打卡/汇总/我的 均 ✓ 在 pages |
| D 文案合规 | `grep -E '减脂\|减肥\|瘦\|燃脂\|塑形' miniprogram/` | 0 命中 ✓ |
| E wxml 风险 | 人工核 wxml | 纯静态 view/text，无 wx:for/wx:if（避开编译盲区）|

**QA 待补**（Dev 做不了，必须人工）：微信开发者工具导入 `miniprogram/` → 真编译 0 error → 4 tab 可点切换 → 各 tab 空白占位页正常渲染。

**Dev 假设**：① `appid` 暂置 `touristappid`（真 appid 是外部依赖 #2 行政办，QA/人工真编译时可在工具内换成测试号或真号）；② tabBar 用纯文字、无 icon PNG（占位阶段免造图标二进制；M0-003 成功标准只要「4 tab 占位」未要求图标）；③ `project.config.json` 放在 `miniprogram/` 内、`libVersion` 置 `3.5.0`。

---

### Dev 自验 · M0-004（2026-06-28 夜，Dev 窗，commit `7d165e1`）

实现：`src/config/env.validation.ts` + main.ts 启动前 `import 'dotenv/config'` → `validateEnv()`。硬必填 `DATABASE_URL`/`JWT_SECRET`，选填 `WX_*`/`OSS_*`/`AI_VISION_*`/`OCR_*`。

| 项 | 命令（从 /tmp 跑、无 .env 干扰）| 结果 |
|---|---|---|
| A 缺两个必填 | `env -u DATABASE_URL -u JWT_SECRET node dist/main.js` | `[env] 启动失败：缺少必填环境变量 DATABASE_URL, JWT_SECRET …`，**退出码 1** ✓ |
| B 仅缺 JWT | `env -u JWT_SECRET DATABASE_URL=… node dist/main.js` | 精确只列 `JWT_SECRET`，**退出码 1** ✓ |
| C 完整 env | server/ 下带 .env，`PORT=3002 node dist/main.js` | 选填项 `console.warn` 一行（列出 12 个未配集成项）→ 正常启动 → `curl :3002/health` 返 `200 {"status":"ok"}` ✓ |
| D 收尾 | `lsof -iTCP:3002` | 无残留监听 ✓ |

结论：必填缺失 fail-fast 退出码 1 + 中文明确提示并指向 .env.example；选填缺失仅告警不阻塞，符合指引④。

---

### Dev 自验 · M0-005（2026-06-28 夜，Dev 窗，commit `32a5d3d`）

实现：`scripts/check-compliance.sh`（bash，`set -euo pipefail`），禁用词 `减脂|减肥|瘦|燃脂|塑形`，扫 `miniprogram` 下 `.wxml`/`.js`/`.json`。

| 项 | 操作 | 结果 |
|---|---|---|
| A 干净树 | `./scripts/check-compliance.sh` | `✓ 未命中`，**退出码 0** |
| B 植入禁用词 | 临时写 `<view>燃脂训练</view>` 到一 .wxml 后跑 | `✗ 命中…` 并打印 `文件:行:内容`，**退出码 1** ✓ |
| C 清除后 | 删临时文件再跑 | 恢复 **退出码 0** ✓ |

**Dev 假设**：① 词表取成功标准所列核心 5 词；CLAUDE.md 第五节提到的「极限词/医疗暗示词」未逐一入表（避免误报，留 PM 后续扩词）；② 扫描范围在成功标准要求的 `.wxml/.js` 基础上**附带 `.json`**（tabBar/导航标题等用户可见文案在 json），属低风险硬化；如 PM 要求严格按 spec 仅扫两类，删 `--include='*.json'` 即可。

---

### Dev 自验 · M0-006（2026-06-28 夜，Dev 窗，commit `5c52c73`）

实现：`scripts/check-secrets.sh` 三检——①`.env` 家族禁入库（仅许 `.env.example`）②已跟踪文件扫强模式（私钥块/`AKIA`/`LTAI`/`sk-`/`gh*_`）+ 通用密钥赋值（排占位词+lock 文件）③磁盘 `.env*`（含本地 gitignored）仅扫真实云密钥强模式。

| 项 | 操作（合成测试串，非真实凭证）| 结果 |
|---|---|---|
| A 干净树 | 直接跑（本地 `server/.env` 含 dev 占位密钥）| `✓ 无泄漏`，**退 0**（占位不误报）✓ |
| B 本地 .env* 真实云密钥 | 临时 `.env.secrettest` 写阿里云 `LTAI…` 串 | `✗ 含真实密钥强模式`，**退 1** ✓ |
| C 已跟踪文件 AWS | `git add` 一 .ts 含 `AKIA…` | `✗ 强模式`，**退 1** ✓ |
| D 已跟踪文件通用密钥 | `git add` 一 .ts 含 `appsecret="…24位…"` | `✗ 疑似明文密钥赋值`，**退 1** ✓ |
| E .env 家族入库 | `git add -f` 根级临时 `.env` | `✗ .env 家族被跟踪`，**退 1** ✓ |
| F 回归 | 全部清理后再跑 | **退 0** ✓ |

收尾确认：无 `__sectest*`/`.env.secrettest`/根 `.env` 残留；`server/.env` 完好且仍被 `.gitignore` 忽略。

**Dev 假设**：① 强模式覆盖私钥块 + AWS/阿里云 AK + OpenAI `sk-` + GitHub PAT；通用赋值匹配 `secret/token/password/appsecret/api_key/access_key` 后 ≥16 位值，并用占位白名单（example/your/changeme/dummy/not-a-real/dev-local 等）降误报。② `package-lock.json` 排除出扫描（机器生成的哈希噪声）。③ 本地 `.env*` 只扫强模式、不扫通用赋值——避免对 dev 假密钥误报；如 PM 要更严可去掉该豁免。

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
