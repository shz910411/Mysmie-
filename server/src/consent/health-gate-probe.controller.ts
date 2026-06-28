import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DevOnlyGuard } from '../common/dev-only.guard';
import { HealthConsentGuard } from './health-consent.guard';

/**
 * dev 专用诊断：验证 HealthConsentGuard 行为（生产 404）。
 * 未同意 health_data → 403；同意后 → {unlocked:true}；撤回后重新 403。
 * M2/M3 称重/打卡控制器落地后，守卫挂到真实接口，本探针可移除。
 */
@Controller('dev')
export class HealthGateProbeController {
  @UseGuards(DevOnlyGuard, JwtAuthGuard, HealthConsentGuard)
  @Get('health-gate-probe')
  probe() {
    return { unlocked: true };
  }
}
