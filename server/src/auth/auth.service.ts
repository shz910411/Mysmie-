import {
  BadRequestException,
  ConflictException,
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

const PG_UNIQUE_VIOLATION = '23505';

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

  /**
   * 绑定手机号（真机验收项）。用微信新版 phone-code API：
   * 前端 button open-type=getPhoneNumber 返 code → 后端换 access_token → 取手机号。
   * 写 users.phone（DB 唯一约束）；号码已属他人 → 提示迁移而非新建。
   */
  async bindPhone(userId: number, code: string): Promise<{ phone: string }> {
    if (!code) throw new BadRequestException('缺少 code');
    const appid = process.env.WX_APPID;
    const secret = process.env.WX_APPSECRET;
    if (!appid || !secret) {
      throw new ServiceUnavailableException(
        '微信手机号未配置（WX_APPID/WX_APPSECRET）。真机验收项，本地无法换号。',
      );
    }
    const accessToken = await this.getAccessToken(appid, secret);
    const resp = await fetch(
      `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      },
    );
    const data = (await resp.json()) as {
      errcode?: number;
      errmsg?: string;
      phone_info?: { phoneNumber: string; purePhoneNumber: string };
    };
    if (data.errcode || !data.phone_info) {
      throw new UnauthorizedException(`获取手机号失败：${data.errmsg ?? '无 phone_info'}`);
    }
    const phone = data.phone_info.purePhoneNumber || data.phone_info.phoneNumber;
    try {
      await this.db.query(
        `UPDATE users SET phone = $1, updated_at = now() WHERE id = $2`,
        [phone, userId],
      );
    } catch (err) {
      if ((err as { code?: string })?.code === PG_UNIQUE_VIOLATION) {
        throw new ConflictException(
          '该手机号已绑定其他账号，请联系客服迁移，而非新建账号',
        );
      }
      throw err;
    }
    return { phone };
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

  /** 取微信全局 access_token（生产应缓存约 2h，此处每次拉取，留真机阶段优化）。 */
  private async getAccessToken(appid: string, secret: string): Promise<string> {
    const resp = await fetch(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`,
    );
    const data = (await resp.json()) as {
      access_token?: string;
      errcode?: number;
      errmsg?: string;
    };
    if (!data.access_token) {
      throw new ServiceUnavailableException(
        `获取 access_token 失败：${data.errmsg ?? '未知错误'}`,
      );
    }
    return data.access_token;
  }

  private sign(userId: number): string {
    return this.jwt.sign({ sub: userId });
  }
}
