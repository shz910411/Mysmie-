import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';

interface UpsertResult {
  id: number;
  isNew: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwt: JwtService,
  ) {}

  /** 真微信登录：code2Session 换 openid（需真 AppSecret + 真机）。 */
  async login(code: string): Promise<{ token: string; isNew: boolean }> {
    if (!code) throw new BadRequestException('缺少 code');
    const appid = process.env.WX_APPID;
    const secret = process.env.WX_APPSECRET;
    if (!appid || !secret) {
      throw new ServiceUnavailableException(
        '微信登录未配置（WX_APPID/WX_APPSECRET）。本地开发请用 POST /auth/dev-login。',
      );
    }
    const url =
      `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}` +
      `&secret=${secret}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`;
    const resp = await fetch(url);
    const data = (await resp.json()) as {
      openid?: string;
      errcode?: number;
      errmsg?: string;
    };
    if (data.errcode || !data.openid) {
      throw new UnauthorizedException(`微信登录失败：${data.errmsg ?? '无 openid'}`);
    }
    // session_key 不外泄：不返回、不入库、不日志
    const { id, isNew } = await this.upsertByOpenid(data.openid);
    return { token: this.sign(id), isNew };
  }

  /** dev 登录旁路：仅 NODE_ENV=development 由控制器放行（生产 404）。 */
  async devLogin(openid?: string): Promise<{ token: string; isNew: boolean; userId: number }> {
    const realOpenid = openid && openid.trim() !== '' ? openid.trim() : `dev_${Date.now()}`;
    const { id, isNew } = await this.upsertByOpenid(realOpenid);
    return { token: this.sign(id), isNew, userId: id };
  }

  /** 按 openid upsert，原子返回 id 与是否新建（xmax=0 表示本次为新插入行）。 */
  private async upsertByOpenid(openid: string): Promise<UpsertResult> {
    const { rows } = await this.db.query<{ id: number; is_new: boolean }>(
      `INSERT INTO users (openid) VALUES ($1)
       ON CONFLICT (openid) DO UPDATE SET updated_at = now()
       RETURNING id, (xmax = 0) AS is_new`,
      [openid],
    );
    return { id: rows[0].id, isNew: rows[0].is_new };
  }

  private sign(userId: number): string {
    return this.jwt.sign({ sub: userId });
  }
}
