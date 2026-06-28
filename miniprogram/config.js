// 前端运行配置。上线时：API_BASE 改为已备案 HTTPS 域名，DEV 置 false。
const API_BASE = 'http://localhost:3000';
const DEV = true; // 本地开发=true 显示「开发登录」入口；上线置 false
const CONSENT_VERSION = { privacy: 'v1', health_data: 'v1' };

module.exports = { API_BASE, DEV, CONSENT_VERSION };
