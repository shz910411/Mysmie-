/**
 * 启动期环境变量校验（M0-004）。
 * 硬性必填缺失 → fail-fast 退出；选填集成项缺失 → 仅告警，不阻塞启动。
 */

// 缺一不可，否则进程无法安全工作
const REQUIRED = ['DATABASE_URL', 'JWT_SECRET'] as const;

// 后续里程碑才接入的集成项；M0 缺失不阻塞，仅提醒
const OPTIONAL = [
  'WX_APPID',
  'WX_APPSECRET',
  'OSS_REGION',
  'OSS_BUCKET',
  'OSS_ACCESS_KEY_ID',
  'OSS_ACCESS_KEY_SECRET',
  'OSS_ENDPOINT',
  'AI_VISION_PROVIDER',
  'AI_VISION_ENDPOINT',
  'AI_VISION_API_KEY',
  'OCR_ENDPOINT',
  'OCR_API_KEY',
] as const;

function isBlank(key: string): boolean {
  const v = process.env[key];
  return v === undefined || v.trim() === '';
}

export function validateEnv(): void {
  const missingRequired = REQUIRED.filter(isBlank);
  if (missingRequired.length > 0) {
    console.error(
      `[env] 启动失败：缺少必填环境变量 ${missingRequired.join(', ')}。` +
        `请在 server/.env 或部署环境中配置后重试（参考 .env.example）。`,
    );
    process.exit(1);
  }

  const missingOptional = OPTIONAL.filter(isBlank);
  if (missingOptional.length > 0) {
    console.warn(
      `[env] 提示：以下选填集成项未配置，相关功能在后续里程碑接入，当前不阻塞启动：` +
        `${missingOptional.join(', ')}`,
    );
  }
}
