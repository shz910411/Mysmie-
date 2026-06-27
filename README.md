# 迈思美小程序

> **一句话**：用户称重 + 拍照吃饭打卡（AI 解析能量）+ 当日汇总一键转发微信群；运营激励在微信群，小程序只做"群里做不了的"。

## 当前状态

- **阶段**：v3 零重启（旧代码作废，需求保留，从零按逻辑重建）
- **范围**：17 屏 + 公司后台 8 模块全做，前后端必须打通
- **开发模式**：3 窗 Claude 会话（PM / Dev / QA），单 AI 主力 + Cursor 可移植保险

## 怎么跑（待 Dev 窗实现后填）

```bash
# 小程序端
cd miniprogram && # 微信开发者工具导入

# 后端
cd server && npm install && npm run start:dev
```

## 文档地图（必读顺序）

1. [CLAUDE.md](./CLAUDE.md) — 项目宪法（Karpathy 4 守则 + 反传销铁律）
2. [docs/00-需求.md](./docs/00-需求.md) — 17 屏 + 8 后台模块全景
3. [docs/01-里程碑.md](./docs/01-里程碑.md) — M0-M9 串行模块化
4. [docs/02-技术架构.md](./docs/02-技术架构.md) — 11 表 + API 规范
5. [docs/issues.md](./docs/issues.md) — 当前任务来源（Dev 窗唯一取任务处）

## 完整老规格文档（背景）

位于 Obsidian 仓库 `数字化与AI/迈思美减脂小程序/`，含 06-10 v2 六份定稿 + 06-19 审计清单。本仓库 docs/ 是其浓缩冻结版，遇冲突以 docs/ 为准。

## 目录结构

```
迈思美小程序/
├── README.md           ← 你正在读
├── CLAUDE.md           ← 项目宪法
├── docs/               ← PM 窗维护，Dev/QA 必读
├── miniprogram/        ← 小程序前端（微信原生）
├── server/             ← 后端（NestJS + PostgreSQL）
├── scripts/            ← seed/部署/工具
├── .env.example        ← 环境变量模板
└── .gitignore
```
