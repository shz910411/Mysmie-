import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

/** 仅 NODE_ENV=development 放行，否则 404（隐藏 dev 专用路由）。 */
@Injectable()
export class DevOnlyGuard implements CanActivate {
  canActivate(_ctx: ExecutionContext): boolean {
    if (process.env.NODE_ENV !== 'development') {
      throw new NotFoundException();
    }
    return true;
  }
}
