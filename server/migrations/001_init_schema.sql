-- 001_init_schema.sql · 迈思美 19 张表初始结构
-- 依据 docs/02-技术架构.md 第三节。M0 仅建结构，不引 TypeORM 实体。
-- 全程 IF NOT EXISTS，配合 _migrations 账本表保证 `npm run migrate` 幂等。
-- 建表顺序遵循外键依赖：字典表 → users → 业务表。

-- ── 1. advisors（服务老师字典，非登录账号）──────────────────────────
CREATE TABLE IF NOT EXISTS advisors (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT        NOT NULL,
  phone       TEXT,
  note        TEXT,
  active      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. admin_accounts（后台账号，仅 admin/viewer 两档）─────────────────
CREATE TABLE IF NOT EXISTS admin_accounts (
  id            BIGSERIAL PRIMARY KEY,
  username      TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  role          TEXT        NOT NULL CHECK (role IN ('admin', 'viewer')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. users（登录身份=openid；业务身份=phone 唯一）──────────────────
CREATE TABLE IF NOT EXISTS users (
  id               BIGSERIAL PRIMARY KEY,
  openid           TEXT        NOT NULL UNIQUE,
  phone            TEXT        UNIQUE,
  nickname         TEXT,
  gender           TEXT        CHECK (gender IN ('male', 'female', 'other')),
  height_cm        NUMERIC(5,1),
  target_weight_kg NUMERIC(5,1),
  advisor_id       BIGINT      REFERENCES advisors(id),
  group_tag        TEXT,
  status           TEXT        NOT NULL DEFAULT 'active'
                               CHECK (status IN ('active', 'disabled', 'deleted')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_advisor ON users (advisor_id);

-- ── 4. consent_records（同意留痕，支持撤回）──────────────────────────
CREATE TABLE IF NOT EXISTS consent_records (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT      NOT NULL REFERENCES users(id),
  type       TEXT        NOT NULL CHECK (type IN ('privacy', 'health_data')),
  version    TEXT        NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_consent_user_type ON consent_records (user_id, type);

-- ── 5. weight_records（称重 + 14 项体成分，体成分均可空）────────────────
CREATE TABLE IF NOT EXISTS weight_records (
  id                  BIGSERIAL PRIMARY KEY,
  user_id             BIGINT      NOT NULL REFERENCES users(id),
  weight_kg           NUMERIC(5,2),
  measured_at         TIMESTAMPTZ NOT NULL,
  source              TEXT        NOT NULL CHECK (source IN ('manual', 'photo', 'ble')),
  is_morning          BOOLEAN     NOT NULL DEFAULT false,
  photo_key           TEXT,
  supplier_record_id  TEXT,
  raw_payload         JSONB,
  client_uuid         TEXT,                    -- POST /weights 幂等键
  -- 14 项体成分（蓝牙时由 raw_payload 归一化；fatty_liver_level 存而默认不展示）
  bmi                 NUMERIC(5,2),
  body_fat_pct        NUMERIC(5,2),
  fat_kg              NUMERIC(5,2),
  subcut_fat_pct      NUMERIC(5,2),
  visceral_fat_level  NUMERIC(5,2),
  water_pct           NUMERIC(5,2),
  skeletal_muscle_kg  NUMERIC(5,2),
  muscle_kg           NUMERIC(5,2),
  bone_kg             NUMERIC(5,2),
  bmr_kcal            INTEGER,
  protein_pct         NUMERIC(5,2),
  body_age            SMALLINT,
  health_score        SMALLINT,
  fatty_liver_level   NUMERIC(5,2),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_weight_user_measured ON weight_records (user_id, measured_at);
-- 幂等键：同一用户同一 client_uuid 只入一笔
CREATE UNIQUE INDEX IF NOT EXISTS uq_weight_client_uuid
  ON weight_records (user_id, client_uuid) WHERE client_uuid IS NOT NULL;

-- ── 6. meal_records（一次打卡一条）──────────────────────────────────
CREATE TABLE IF NOT EXISTS meal_records (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT      NOT NULL REFERENCES users(id),
  meal_date   DATE        NOT NULL,
  meal_type   TEXT        NOT NULL
                          CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  photo_key   TEXT,
  photo_kind  TEXT        CHECK (photo_kind IN ('food', 'label')),
  ai_status   TEXT        NOT NULL DEFAULT 'pending'
                          CHECK (ai_status IN ('pending', 'processing', 'done', 'failed')),
  ai_raw      JSONB,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_meal_user_date ON meal_records (user_id, meal_date);

-- ── 7. meal_items（当日汇总 = sum(kcal)）────────────────────────────
CREATE TABLE IF NOT EXISTS meal_items (
  id              BIGSERIAL PRIMARY KEY,
  meal_record_id  BIGINT      NOT NULL REFERENCES meal_records(id) ON DELETE CASCADE,
  food_name       TEXT        NOT NULL,
  portion_text    TEXT,
  kcal            INTEGER,
  source          TEXT        NOT NULL CHECK (source IN ('ai', 'user', 'label_ocr')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_meal_items_record ON meal_items (meal_record_id);

-- ── 8. daily_logs（饮水/排便选填，user_id+date 唯一）────────────────
CREATE TABLE IF NOT EXISTS daily_logs (
  user_id       BIGINT      NOT NULL REFERENCES users(id),
  log_date      DATE        NOT NULL,
  water_cups    INTEGER     NOT NULL DEFAULT 0,
  water_cup_ml  INTEGER     NOT NULL DEFAULT 250,
  bowel_count   INTEGER     NOT NULL DEFAULT 0,
  bowel_status  TEXT        CHECK (bowel_status IN ('smooth', 'normal', 'hard')),
  sleep_hours   NUMERIC(3,1),
  note          TEXT,
  PRIMARY KEY (user_id, log_date)
);

-- ── 9. advisor_change_logs（归属调整留痕）──────────────────────────
CREATE TABLE IF NOT EXISTS advisor_change_logs (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT      NOT NULL REFERENCES users(id),
  old_advisor_id  BIGINT      REFERENCES advisors(id),
  new_advisor_id  BIGINT      REFERENCES advisors(id),
  changed_by      BIGINT      REFERENCES admin_accounts(id),
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_advisor_change_user ON advisor_change_logs (user_id);

-- ── 10. data_shares（扁平共享，活跃关系唯一，移除即时）────────────────
CREATE TABLE IF NOT EXISTS data_shares (
  id              BIGSERIAL PRIMARY KEY,
  owner_user_id   BIGINT      NOT NULL REFERENCES users(id),
  viewer_user_id  BIGINT      NOT NULL REFERENCES users(id),
  status          TEXT        NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'revoked')),
  source          TEXT        NOT NULL CHECK (source IN ('user_invite', 'company_assign')),
  invite_code     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at      TIMESTAMPTZ
);
-- 活跃唯一：(owner,viewer) 只允许一条 active，历史 revoked 可重复
CREATE UNIQUE INDEX IF NOT EXISTS uq_data_shares_active
  ON data_shares (owner_user_id, viewer_user_id) WHERE status = 'active';
-- 邀请码单次有效：活跃邀请码唯一
CREATE UNIQUE INDEX IF NOT EXISTS uq_data_shares_invite_code
  ON data_shares (invite_code) WHERE invite_code IS NOT NULL;

-- ── 11. service_notes（visible_to_owner = 老师的话）────────────────
CREATE TABLE IF NOT EXISTS service_notes (
  id              BIGSERIAL PRIMARY KEY,
  owner_user_id   BIGINT      NOT NULL REFERENCES users(id),
  author_user_id  BIGINT      NOT NULL REFERENCES users(id),
  ref_date        DATE        NOT NULL,
  content         TEXT        NOT NULL,
  visibility      TEXT        NOT NULL DEFAULT 'visible_to_owner'
                              CHECK (visibility IN ('visible_to_owner', 'team_only')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_service_notes_owner_date ON service_notes (owner_user_id, ref_date);

-- ── 12. service_day_marks（逐日归档/关注，(owner,viewer,date) 唯一）──
CREATE TABLE IF NOT EXISTS service_day_marks (
  id              BIGSERIAL PRIMARY KEY,
  owner_user_id   BIGINT      NOT NULL REFERENCES users(id),
  viewer_user_id  BIGINT      NOT NULL REFERENCES users(id),
  mark_date       DATE        NOT NULL,
  mark            TEXT        NOT NULL CHECK (mark IN ('reviewed', 'flagged')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, viewer_user_id, mark_date)
);

-- ── 13. stage_records（体型照三面+围度+舌诊，whr 生成列）──────────────
CREATE TABLE IF NOT EXISTS stage_records (
  id                  BIGSERIAL PRIMARY KEY,
  user_id             BIGINT      NOT NULL REFERENCES users(id),
  stage               TEXT        NOT NULL CHECK (stage IN ('baseline', 'periodic', 'final')),
  taken_at            TIMESTAMPTZ NOT NULL,
  front_photo_key     TEXT,
  side_photo_key      TEXT,
  back_photo_key      TEXT,
  tongue_photo_key    TEXT,
  waist_cm            NUMERIC(5,1),
  hip_cm              NUMERIC(5,1),
  thigh_cm            NUMERIC(5,1),
  whr                 NUMERIC(4,2) GENERATED ALWAYS AS (
                        CASE WHEN hip_cm IS NOT NULL AND hip_cm <> 0
                             THEN waist_cm / hip_cm ELSE NULL END
                      ) STORED,
  visible_to_advisors BOOLEAN     NOT NULL DEFAULT true,
  note                TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stage_user ON stage_records (user_id, stage);

-- ── 14. health_reports（仅存储展示，系统不做任何医疗解读）──────────────
CREATE TABLE IF NOT EXISTS health_reports (
  id                  BIGSERIAL PRIMARY KEY,
  user_id             BIGINT      NOT NULL REFERENCES users(id),
  type                TEXT        NOT NULL CHECK (type IN ('biochem', 'physical', 'other')),
  file_key            TEXT        NOT NULL,
  taken_at            TIMESTAMPTZ,
  note                TEXT,
  visible_to_advisors BOOLEAN     NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_health_reports_user ON health_reports (user_id);

-- ── 15. notifications（通知类型 + target 驱动跳转）──────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT      NOT NULL REFERENCES users(id),
  type        TEXT        NOT NULL,
  title       TEXT        NOT NULL,
  body        TEXT,
  target      JSONB,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at);

-- ── 16. onboarding_tasks（S17 开启之礼 5 项进度）────────────────────
CREATE TABLE IF NOT EXISTS onboarding_tasks (
  user_id   BIGINT      NOT NULL REFERENCES users(id),
  task_key  TEXT        NOT NULL,
  done_at   TIMESTAMPTZ,
  PRIMARY KEY (user_id, task_key)
);

-- ── 17. shipments（礼品发货管理）────────────────────────────────────
CREATE TABLE IF NOT EXISTS shipments (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT      NOT NULL REFERENCES users(id),
  recipient   TEXT        NOT NULL,
  phone       TEXT        NOT NULL,
  address     TEXT        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'shipped', 'delivered', 'cancelled')),
  tracking_no TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shipments_user ON shipments (user_id);

-- ── 18. media_download_logs（下载审计）─────────────────────────────
CREATE TABLE IF NOT EXISTS media_download_logs (
  id             BIGSERIAL PRIMARY KEY,
  operator_id    BIGINT      REFERENCES admin_accounts(id),
  owner_user_id  BIGINT      REFERENCES users(id),
  scope          TEXT        NOT NULL CHECK (scope IN ('single', 'batch')),
  file_keys      JSONB,
  date_range     JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_logs_owner_created ON media_download_logs (owner_user_id, created_at);

-- ── 19. export_jobs（异步导出任务）─────────────────────────────────
CREATE TABLE IF NOT EXISTS export_jobs (
  id           BIGSERIAL PRIMARY KEY,
  operator_id  BIGINT      REFERENCES admin_accounts(id),
  params       JSONB,
  status       TEXT        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  zip_key      TEXT,
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_export_jobs_operator ON export_jobs (operator_id);
