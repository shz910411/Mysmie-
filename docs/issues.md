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
| M0-002 | PostgreSQL 表迁移脚本 | P0 | 已关闭 | ✅ **QA 通过**（见下方「QA 批量验收·M0-002」）。按 [02-技术架构.md 第三节](./02-技术架构.md) 表全部创建；外键/索引/约束（含 data_shares 活跃唯一约束）正确；`npm run migrate` 幂等。**环境已备**（PM 2026-06-28）：本机 PostgreSQL 16 在跑，目标库=干净空库 `maisimei`（旧项目库已归档为 `maisimei_old`，**勿连**）；`DATABASE_URL=postgresql://sunchester@localhost:5432/maisimei`（本地 trust 认证无密码）。**注意**：02 文档表清单含 notifications/onboarding_tasks/shipments/media_download_logs/export_jobs，实际 >11 张，**以 02 文档为准全建，标题"11"是旧估值勿当上限** — **Dev 已完成** commit `122b21c` 分支 `feature/m0-rest`，验收证据见下方「Dev 自验·M0-002」 |
| M0-003 | 小程序空壳 + 微信开发者工具能预览 | P0 | 已关闭 | ✅ **QA 通过（真编译已过）**。微信开发者工具导入 `miniprogram/` 真编译成功、首页空白占位页可预览、底部 4 tab（称重/打卡/汇总/我的）齐全且**逐个点击可切换**（QA computer-use 直接观察编译+渲染，4 tab 切换由 Chester 本人在工具内点验）— commit `1cdaeac` 分支 `feature/m0-rest`，详见下方「QA 批量验收·M0-003」 |
| M0-004 | .env.example 已就位，启动检查必填项 | P0 | 已关闭 | ✅ **QA 通过**（见下方「QA 批量验收·M0-004」）。缺关键 env（DATABASE_URL/JWT_SECRET）启动报错给出明确提示 — **Dev 已完成** commit `7d165e1` 分支 `feature/m0-rest` |
| M0-005 | CI 轻体词表扫描脚本 | P1 | 已关闭 | ✅ **QA 通过**（见下方「QA 批量验收·M0-005」）。scripts/check-compliance.sh 扫 miniprogram/**/*.{wxml,js} 命中 "减脂/减肥/瘦/燃脂/塑形" 退出码非 0 — **Dev 已完成** commit `32a5d3d` 分支 `feature/m0-rest` |
| M0-006 | CI 密钥扫描 | P1 | 已关闭 | ✅ **QA 通过**（见下方「QA 批量验收·M0-006」）。scripts/check-secrets.sh 扫 .env* 与已 commit 文件中的明文 token/secret 模式 — **Dev 已完成** commit `5c52c73` 分支 `feature/m0-rest` |
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

### QA 批量验收证据 · M0-002~006（2026-06-28，QA 窗，分支 `feature/m0-rest`）

环境：PostgreSQL 16.14、node v22.22.0。**真复跑**，非读 Dev 证据放行。

**QA 批量验收·M0-002**（✅ 过）— 用**全新临时库 `maisimei_qa_tmp`**（建前 0 表，绝不连 `maisimei`/`maisimei_old`）从 0 跑：
| 项 | 结果 |
|---|---|
| 首次 migrate | `apply 001_init_schema.sql`，本次应用 1 |
| 19 表全建 | 临时库业务表（排除 `_migrations`）= **19**，清单与 02 文档一致 |
| 幂等 | 二次 migrate `skip`、应用 0、退 0，表数仍 19 |
| data_shares 活跃唯一 | 同 (1,2) 第二条 active → `duplicate key … uq_data_shares_active` 被拒 ✓ |
| revoked 可复活 | 改 revoked 后再插 active 成功；活跃数/总数 = **1/2** ✓ |
| whr 生成列 | 腰80/臀100 → `0.80`；臀 NULL → `NULL` ✓ |
| FK 拦截 | weight_records→user 999999 → `violates foreign key constraint` 被拒 ✓ |
| 收尾 | 临时库 `DROP DATABASE`；`pg_database` 确认 `maisimei`/`maisimei_old` 完好未碰 |

**QA 批量验收·M0-004**（✅ 过）— 从 `/tmp` 跑 `dist/main.js` 避开 `.env` 干扰：缺两必填 `exit=1`+中文提示列两项；仅缺 `JWT_SECRET` `exit=1` 只列该项；`JWT_SECRET=""` 空白也判缺 `exit=1`（trim 生效）；完整 env `PORT=3007` → 选填 12 项 `console.warn` → Nest 启动 → `/health` `200 {"status":"ok"}`；进程清理无残留。

**QA 批量验收·M0-005**（✅ 过）— 干净树 `exit=0`；植入 `<view>燃脂训练营</view>` 到临时 wxml → `exit=1` 并打印 `文件:行:内容`；删除后 `exit=0`；临时文件清理、`git status` clean。

**QA 批量验收·M0-006**（✅ 过）— 六态（合成测试串，非真实凭证）：干净树（`server/.env` dev 占位）`exit=0` 不误报；本地 `.env*` 阿里云 `LTAI…` `exit=1`；已跟踪 `AKIA…` `exit=1`；已跟踪通用 `appsecret=` 24位 `exit=1`；`.env` 家族被 `git add -f` `exit=1`；全清理回归 `exit=0`。每步后 `git reset`+`rm`，`.env.example` 是唯一入库 env，全程 `git status` clean。

**QA 批量验收·M0-003**（⏳ 代码就绪度过，真编译挂起）— QA 能验的全过：7 个 JSON `JSON.parse` 全合法；4 页 × `.js/.json/.wxml` 共 12 文件齐全；tabBar 4 tab（称重/打卡/汇总/我的）pagePath 全部 ∈ `pages[]`；wxml 纯静态 `view/text`，**无 `wx:for/wx:if/wx:elif` 动态指令**（避开 [[feedback_miniprogram_wxml_verify_blindspot]] 编译盲区）；0 违禁词。

**真编译结果（2026-06-28，QA computer-use 驱动微信开发者工具）**：
- ✅ 导入 `迈思美小程序/miniprogram/`（AppID 测试号，占位 `touristappid`）→ **编译成功**，模拟器渲染出真实页面（早先选错外层目录报的「app.json 未找到」已排除——必须选到 `miniprogram` 这一层）。
- ✅ 底部 **4 tab 齐**（称重/打卡/汇总/我的），`pages/me/me` 占位页正常渲染（标题「我的」+「页面占位·主线功能见 M5」灰字）；配色 `#FAFBF2` 米底 + 绿强调，无违禁词。
- ✅ **4 tab 逐个点击可切换**——由 Chester 本人在工具内点验确认（QA computer-use 因本机多屏 + Stage Manager 输入前台被判给「程序坞」，点击网关进不去开发者工具，仅能截图观察；此为环境限制，非代码问题）。
- ⚠️ **非阻塞观察**：调试器显示 `Errors: 1, Warnings: 11`。QA 点击通道受限未能读到错误原文；空壳阶段经验上多为模拟器上报请求/测试号 appid/无 tab 图标等无害项，且**不在 M0-003 成功标准内**（标准只要「能预览 + 4 tab 占位」）。记为非阻塞项：M1 开发者下次打开工具时顺手点 Console 确认；若实为真实页面错误则转 M1 Issue 修。

**批量结论**：M0-002/003/004/005/006 **5 条全部 QA 通过 → M0 里程碑完成**。已批量 ff 合并 main + 打 tag `v0.1.0` + 删 `feature/m0-rest` 分支。

---

## M1 · 登录建档（M0 已过，🟢 开启）

> PM 拆解依据：01 文档 S1/S2/S3 成功标准 + 02 文档 auth/profile/consent API 契约。开发顺序按下表 ID（schema 补丁 → 后端 → 守卫 → 前端 → 真机项最后）。

### 两条 M1 设计决策（PM，2026-06-29，开工前必读）

**① dev 登录旁路（解决微信登录本地跑不了）**
微信 `code2Session`/`getPhoneNumber` 依赖真机+真 AppSecret，本地/QA 无真机跑不了。M1-001 必须同时实现 `POST /auth/dev-login`（**仅 `NODE_ENV=development` 生效**，传 `{openid?}` 直接 upsert+签 JWT），让后端 profile/consent/守卫 + 前端页面全部能本地真实联调。**安全红线**：生产构建该路由必须不存在/返 404，QA 必验。真 `code2Session` 标"真机验收项"。

**② 年龄存出生年**
S3 建档填"年龄"，但 `users` 表无年龄列（01/02 文档 gap）。M1-001b 补 migration `002` 加 `users.birth_year INT`；S3 让用户填年龄，后端转存 `birth_year = 当前年 - 年龄`，显示再算回。不存 age（会过时）。

### Issue 表

| ID | 标题 | 优先级 | 状态 | 成功标准 | 依赖真机/凭证 |
|---|---|---|---|---|---|
| M1-001b | migration 002：`users` 补 `birth_year INT` | P0 | 待 QA `5b…` | `002_*.sql` 幂等；列存在；`npm run migrate` 跑通且账本记录 | 否 |
| M1-001 | 后端 auth/login（code2Session）+ dev 旁路 | P0 | 待 QA（真登录待真机）| `POST /auth/login {code}`→jscode2session→openid→upsert users→签 JWT，返 `{token,isNew}`；openid 唯一；session_key 不外泄。**同时** `POST /auth/dev-login` 仅 dev 生效、生产 404 | 真登录需 AppID/Secret+真机；**dev 旁路本地全验** |
| M1-002 | 后端 auth/phone（手机号） | P0 | **待真机验收** | `POST /auth/phone`→换/解密手机号→写 `users.phone`（唯一约束）；重复手机号提示迁移而非建新号 | ⚠️ 真 AppSecret+真机；本地 dev 手填旁路 |
| M1-003 | 后端 users/profile（轻建档） | P0 | 待 QA | `GET/PUT /me/profile`：gender/birth_year/height_cm 入库，target_weight_kg 可选；可改 | 否（dev 旁路 JWT 即可验） |
| M1-004 | 后端 consent（带版本+撤回） | P0 | 待 QA | `POST /me/consents {type,version}`→consent_records；`DELETE /me/consents/:type`→写 revoked_at；同意带版本 | 否 |
| M1-008 | 全局守卫 HealthConsentGuard | P0 | 待 QA（前端入口禁用随 M2 称重入口）| 未同意 health_data 时，称重/打卡类接口返 403；同意后解锁。后端守卫 + 前端入口禁用+友好提示 | 否 |
| M1-005 | 小程序 S1 登录页 | P0 | 待 QA（待 devtools 真编译）| wx.login→/auth/login；getPhoneNumber 按钮→/auth/phone；**dev 环境提供"开发登录"入口走 dev-login**；新用户 ≤3 步进首页 | 真手机号需真机；流程本地 dev 验 |
| M1-006 | 小程序 S2 双层同意页 | P0 | 待 QA（待 devtools 真编译）| 两层：通用隐私(必勾)+健康数据(**独立、非默认勾选、不捆绑**)；拒绝健康同意可浏览但记录功能锁；同意带版本回传 | 否 |
| M1-007 | 小程序 S3 轻建档页 | P0 | 待 QA（待 devtools 真编译）| 性别/年龄/身高 1 屏→PUT /me/profile(年龄转 birth_year)；完成进首页；可在"我的"改 | 否 |
| M1-009 | project.config.json appid 占位→正式号 | P1 | 待 QA（待 devtools 真编译）| appid 从 `touristappid` 改为 `wx4bc078e96fffcd89`（Chester 2026-06-29 确认=迈思美正式号）；微信开发者工具重编译仍通过 4 tab 可预览 | 真机/开发者工具需该号开发权限 |

**M1 完成判据**：①新用户走 S1→S2→S3 ≤3 步进首页（dev 旁路本地可验全链）；②真机微信登录+手机号入库（真机验收项，凭证到位后补验）；③拒绝健康同意则记录功能锁定、同意后解锁；④同意带版本入库；⑤dev 旁路生产环境不存在。

**M1 前置依赖（需 Chester 提供）**：迈思美小程序 **AppID + AppSecret**。
- **AppID = `wx4bc078e96fffcd89`**（Chester 2026-06-29 确认正式号）→ M1-009 把 project.config.json 占位换成它。
- **AppSecret 待 Chester 填** `.env` 的 `WX_APPSECRET`（密钥不进 Git）——真登录(M1-001)/手机号(M1-002)的真机验收要用，不急。
- ⚠️ 即使 AppSecret 未到位，除 M1-001 真登录/M1-002 手机号外的 7 条都能用 dev 旁路本地全开发，不阻塞。

---

### 🌅 Dev 回报 · M1 批量（2026-06-29 完成）

分支 `feature/m1`（从 main 切，全部已推 origin，**未碰 main**，等 QA 批验后 ff 合并）。环境：PostgreSQL 16.14 / node v22.22.0 / NODE_ENV=development。

**架构 Dev 假设（贯穿 M1，待 PM/QA 复核）**：
1. **数据访问层 = pg Pool + 参数化 SQL**（`DatabaseModule` 全局薄封装），延续 M0「不引 TypeORM」决策，真实落库非 mock。
2. **JWT = `@nestjs/jwt` + 自写 `JwtAuthGuard`**（免 passport 依赖）；payload `{sub:userId}`；bigint id 经 node-pg 返字符串，守卫 `Number()` 归一，id 远在安全整数内无碍。
3. **`DevOnlyGuard`**：dev 专用路由（dev-login 内联检查、health-gate-probe 用守卫）生产一律 404。
4. **M1-002 手机号用微信新版 phone-code API**（`getuserphonenumber`），免 session_key 解密，与「session_key 不外泄/不入库」一致。
5. **前端**：`config.js` 的 `DEV/API_BASE`，dev 走 `http://localhost:3000`（依赖工具不校验合法域名）；上线改 HTTPS 域名 + `DEV=false`。

| Issue | 状态 | commit | 自验结果 |
|---|---|---|---|
| M1-001b | 待 QA | `fa4c4ea` | migrate apply 002；`birth_year integer` 存在；账本记录；二次跑全 skip 退0 |
| M1-001 | 待 QA（真登录待真机）| `537d5c9` | dev-login 签 JWT(sub=userId)+真入库；isNew true→false；login 无凭证 503；**生产 dev-login 404 而 /health 200**（安全红线）|
| M1-003 | 待 QA | `65feace` | ⭐链路门：dev-login→JWT→守卫401→GET/PUT profile→真入库(`female\|1991\|170.0\|60.0`，birth_year=2026-35)；部分更新只动指定字段；校验 400 三态 |
| M1-004 | 待 QA | `accbf77` | 空→grant→幂等(同版本不重插)→换版本(旧 revoked/新 active)→DELETE 写 revoked_at→终态正确；校验 400 |
| M1-008 | 待 QA | `8a12476` | 无同意 probe 403→同意 200 unlocked→撤回即时重锁 403→无 token 401→生产 probe 404 |
| M1-002 | **待真机验收** | `4d476e1` | 本地验：守卫 401/无 code 400/无凭证 503；DB `users.phone` 唯一约束实测拦重复（冲突处理 premise 成立）。真解码+409 迁移提示待真机 |
| M1-005/6/7 | 待 QA（待 devtools 真编译）| `f0fac71` | JSON 合法/7 页齐全/JS `node --check` 全过/合规 0 命中；前后端调真实 /auth、/me/consents、/me/profile 非 mock。**wxml 真编译待人工 devtools** |
| M1-009 | 待 QA（待 devtools 真编译）| `0c36bf3` | appid → `wx4bc078e96fffcd89`，JSON 合法；真编译待 devtools |
| （附带）| — | `a44d578` | **修 M0-006 扫描器**：M1 真实代码暴露 GENERIC 误报 `process.env.X`/`wx.getStorageSync`，收紧为仅匹配引号字面量；M0-006 检出能力无回归 |

**QA 待补（Dev 做不了，必须人工）**：
- **真机验收**：M1-001 真微信登录、M1-002 手机号解密（需 Chester 填 `.env` 的 `WX_APPSECRET`）。
- **devtools 真编译**：M1-005/6/7/9 前端 4 项，导入 `miniprogram/` 真编译 + 走 S1→S2→S3→首页全链路（dev 后端需起在 `:3000`）。

**最终回归全绿**：server build 0 error · migrate(001+002) 幂等 · M1 后端端到端 smoke(建档/守卫 403→200) 过 · compliance 退0 · secrets 退0(修复后) · 库测试数据清零 · git 与 origin 同步。

**一句话**：M1 全 10 条开发+自验完成，dev 旁路链路成立（真入库），后端 6 条本地全验、M1-002 待真机、前端 4 条待 devtools；顺手修了 M0-006 扫描器误报。M1-009 后即停，未越界 M2，**待 QA 批验**。

---

## M2-M9 · 待 M1 通过后由 PM 拆出 Issue

> PM 当前只先拆 M0+M1。Dev 窗跑通 M0 后 PM 立即拆 M1 完整 Issue；M1 完成后再拆 M2，避免一次性拆太多失去机动空间（视频 03"小步迭代"建议）。

---

## Backlog · 跨里程碑待办（PM 登记，防遗忘）

| ID | 标题 | 归属里程碑 | 来源 | 说明 |
|---|---|---|---|---|
| BL-001 | 注销/撤回的删除编排（应用层） | M6（S14）| M0-002 Dev 假设 6 PM 裁决 | DB 层 FK 用 RESTRICT（仅 meal_items→meal_records CASCADE），是有意设计。注销/删除全部数据必须走**应用层显式编排**：①按 FK 依赖逆序删所有子表记录 ②删 OSS 上真实图片（餐照/秤照/体型照/报告/舌诊）③写 media_download_logs 或注销审计 ④consent 标记 revoked。**不能靠 DB 级联**（删不了 OSS、留不下审计）。这是 PIPL 硬要求，M6 做 S14 时必须实现，QA 必验"注销后 OSS 文件确实消失 + 审计有记录"。 |

> PM 假设裁决（M0-002，2026-06-28）：Dev 7 条假设全部 ✅ 批准。其中 invite_code 实现为"非空全局唯一"比"活跃唯一"更安全（防旧码重放）；created_at/updated_at 补列零风险；复合主键符合 02 文档；FK RESTRICT 见 BL-001。无需 Dev 返工。
