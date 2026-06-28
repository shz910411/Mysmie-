-- 002_users_birth_year.sql · S3 轻建档「年龄」存出生年
-- 决策（PM 2026-06-29）：不存 age（会过时），存 birth_year，显示再算回当前年龄。
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_year INTEGER;
