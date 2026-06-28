import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

/**
 * 自写 JWT 守卫（免 passport 依赖，极简）。
 * 校验 Authorization: Bearer <token>，成功后把 userId 挂到 request。
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request & { userId?: number }>();
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('缺少 Bearer token');
    }
    const token = header.slice('Bearer '.length);
    try {
      const payload = this.jwt.verify<{ sub: number | string }>(token);
      req.userId = Number(payload.sub);
    } catch {
      throw new UnauthorizedException('token 无效或已过期');
    }
    return true;
  }
}
