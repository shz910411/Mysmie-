import {
  Body,
  Controller,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** 真微信登录（真机验收项）。 */
  @Post('login')
  login(@Body() body: { code?: string }) {
    return this.auth.login(body?.code ?? '');
  }

  /**
   * dev 登录旁路：仅 NODE_ENV=development 生效，其余环境一律 404。
   * 安全红线：生产构建该路由不可用。
   */
  @Post('dev-login')
  devLogin(@Body() body: { openid?: string }) {
    if (process.env.NODE_ENV !== 'development') {
      throw new NotFoundException();
    }
    return this.auth.devLogin(body?.openid);
  }
}
