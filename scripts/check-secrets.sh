#!/usr/bin/env bash
# M0-006 · CI 密钥扫描
# 防明文密钥进库：检查 .env 家族是否被跟踪 + 已跟踪文件 / .env* 中的密钥模式。
# 命中即失败（退出码 1）。grep 无匹配返回 1 属正常，故不开 set -e。
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail=0

# 真实密钥强模式（高置信，跨所有目标统一用）：私钥块 / AWS AK / 阿里云 AK / OpenAI / GitHub PAT
STRONG='-----BEGIN[ A-Z]*PRIVATE KEY-----|AKIA[0-9A-Z]{16}|(LTAI|AKID)[0-9A-Za-z]{12,22}|sk-[A-Za-z0-9]{20,}|gh[pousr]_[A-Za-z0-9]{20,}'

# 通用密钥赋值：仅匹配「引号包裹的字面量值」，避免误报 process.env.X / 函数调用等正确写法。
# 真硬编码密钥必是引号字符串；读 env / storage 不带引号值，天然排除。
GENERIC='(secret|token|passwd|password|appsecret|api[_-]?key|access[_-]?key)["'"'"' ]*[:=] *["'"'"'][A-Za-z0-9/_+.-]{16,}'
PLACEHOLDER='example|your[_-]|changeme|placeholder|xxxx|dummy|<[a-z]|not-a-real|fill[_-]?in|dev-local'

# ── 检查 1：.env 家族不得入库（仅允许 .env.example）──
tracked_env="$(git ls-files | grep -E '(^|/)\.env($|\.)' | grep -vE '\.env\.example$' || true)"
if [ -n "$tracked_env" ]; then
  echo "[secrets] ✗ .env 家族文件被 Git 跟踪（应仅 .env.example 入库）："
  echo "$tracked_env"
  fail=1
fi

# ── 检查 2：已跟踪文件中的密钥（强模式 + 通用赋值，排除 lock 文件机器噪声）──
strong_hits="$(git grep -nEI -e "$STRONG" -- ':!*package-lock.json' 2>/dev/null || true)"
if [ -n "$strong_hits" ]; then
  echo "[secrets] ✗ 已跟踪文件命中真实密钥强模式："
  echo "$strong_hits"
  fail=1
fi
generic_hits="$(git grep -inEI -e "$GENERIC" -- ':!*package-lock.json' ':!*.env.example' 2>/dev/null | grep -vEi "$PLACEHOLDER" || true)"
if [ -n "$generic_hits" ]; then
  echo "[secrets] ✗ 已跟踪文件疑似明文密钥赋值（非占位）："
  echo "$generic_hits"
  fail=1
fi

# ── 检查 3：磁盘 .env* 文件（含本地 gitignored .env）仅扫真实密钥强模式 ──
# 不扫通用赋值：本地 dev .env 常含占位/假密钥，强模式才是真实泄漏信号。
while IFS= read -r f; do
  [ -n "$f" ] || continue
  hits="$(grep -nEI -e "$STRONG" "$f" 2>/dev/null || true)"
  if [ -n "$hits" ]; then
    echo "[secrets] ✗ $f 含真实密钥强模式（请移除，改用部署环境变量）："
    echo "$hits"
    fail=1
  fi
done < <(find . -maxdepth 2 -name '.env*' -type f 2>/dev/null | grep -v '/node_modules/')

if [ "$fail" -ne 0 ]; then
  echo "[secrets] 扫描未通过。"
  exit 1
fi
echo "[secrets] ✓ 未发现明文密钥泄漏"
exit 0
