import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ConsentService } from './consent.service';

/**
 * 健康数据同意守卫：未授予活跃 health_data 同意时拦截（403）。
 * 必须排在 JwtAuthGuard 之后（依赖 req.userId）。
 * 用于 M2/M3 称重/打卡类接口；同意撤回后立即重新锁定。
 */
@Injectable()
export class HealthConsentGuard implements CanActivate {
  constructor(private readonly consent: ConsentService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request & { userId?: number }>();
    if (req.userId == null) {
      throw new UnauthorizedException('未认证');
    }
    const ok = await this.consent.hasActive(req.userId, 'health_data');
    if (!ok) {
      throw new ForbiddenException('需先同意健康数据使用授权后才能使用记录功能');
    }
    return true;
  }
}
