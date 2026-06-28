import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const CONSENT_TYPES = ['privacy', 'health_data'];

interface StatusRow {
  type: string;
  version: string;
  granted_at: Date;
  revoked_at: Date | null;
}

@Injectable()
export class ConsentService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * 授予同意（带版本）。单条数据修改 CTE 保证原子：
   * 先把该 type 下「不同版本」的活跃同意置为 revoked，再「仅当无同版本活跃」时插新。
   * → 重复 POST 同版本幂等；换版本自动留痕旧版本。
   */
  async grant(userId: number, type: string, version: string) {
    this.assertType(type);
    if (!version || typeof version !== 'string' || version.trim() === '') {
      throw new BadRequestException('缺少 version');
    }
    await this.db.query(
      `WITH superseded AS (
         UPDATE consent_records SET revoked_at = now()
         WHERE user_id = $1 AND type = $2 AND revoked_at IS NULL AND version <> $3
         RETURNING id
       )
       INSERT INTO consent_records (user_id, type, version)
       SELECT $1, $2, $3
       WHERE NOT EXISTS (
         SELECT 1 FROM consent_records
         WHERE user_id = $1 AND type = $2 AND version = $3 AND revoked_at IS NULL
       )`,
      [userId, type, version],
    );
    return this.status(userId);
  }

  /** 撤回某 type 的全部活跃同意（写 revoked_at）。 */
  async revoke(userId: number, type: string) {
    this.assertType(type);
    const { rowCount } = await this.db.query(
      `UPDATE consent_records SET revoked_at = now()
       WHERE user_id = $1 AND type = $2 AND revoked_at IS NULL`,
      [userId, type],
    );
    return { type, revoked: rowCount ?? 0 };
  }

  /** 每 type 最新一条的状态（供前端/调试）。 */
  async status(userId: number) {
    const { rows } = await this.db.query<StatusRow>(
      `SELECT DISTINCT ON (type) type, version, granted_at, revoked_at
       FROM consent_records WHERE user_id = $1
       ORDER BY type, granted_at DESC, id DESC`,
      [userId],
    );
    return rows.map((r) => ({
      type: r.type,
      version: r.version,
      active: r.revoked_at == null,
      grantedAt: r.granted_at,
      revokedAt: r.revoked_at,
    }));
  }

  /** 是否存在某 type 的活跃同意（供 HealthConsentGuard 复用）。 */
  async hasActive(userId: number, type: string): Promise<boolean> {
    const { rows } = await this.db.query<{ ok: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM consent_records
         WHERE user_id = $1 AND type = $2 AND revoked_at IS NULL
       ) AS ok`,
      [userId, type],
    );
    return rows[0].ok;
  }

  private assertType(type: string): void {
    if (!CONSENT_TYPES.includes(type)) {
      throw new BadRequestException('type 仅支持 privacy/health_data');
    }
  }
}
