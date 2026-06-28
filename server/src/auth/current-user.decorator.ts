import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/** 取 JwtAuthGuard 挂在 request 上的 userId。 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number => {
    const req = ctx.switchToHttp().getRequest<Request & { userId?: number }>();
    return req.userId as number;
  },
);
