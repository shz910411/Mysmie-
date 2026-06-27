#!/usr/bin/env bash
# M0-005 · CI 轻体词表扫描
# 扫小程序用户可见层，命中禁用词即失败（退出码 1），供 CI / 提交前调用。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="$ROOT/miniprogram"

# 核心禁用词（成功标准所列 5 词）。如需扩展极限词/医疗暗示词，在此追加即可。
FORBIDDEN='减脂|减肥|瘦|燃脂|塑形'

# 扫描范围：必扫 .wxml/.js（成功标准）；附带 .json（tabBar/导航标题等用户可见文案）。
INCLUDES=(--include='*.wxml' --include='*.js' --include='*.json')

if [ ! -d "$TARGET_DIR" ]; then
  echo "[compliance] 未找到 $TARGET_DIR，跳过（暂无小程序代码）"
  exit 0
fi

matches="$(grep -rnE "$FORBIDDEN" "${INCLUDES[@]}" "$TARGET_DIR" || true)"

if [ -n "$matches" ]; then
  echo "[compliance] ✗ 命中轻体禁用词（减脂/减肥/瘦/燃脂/塑形），请改用「轻体/科学轻体」："
  echo "$matches"
  exit 1
fi

echo "[compliance] ✓ 用户可见层未命中禁用词"
exit 0
