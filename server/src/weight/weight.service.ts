import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

// API camelCase ↔ DB snake_case 的 14 项体成分映射（fatty_liver_level 存而默认不展示）
const BODY_FIELDS: Array<[string, string]> = [
  ['bmi', 'bmi'],
  ['bodyFatPct', 'body_fat_pct'],
  ['fatKg', 'fat_kg'],
  ['subcutFatPct', 'subcut_fat_pct'],
  ['visceralFatLevel', 'visceral_fat_level'],
  ['waterPct', 'water_pct'],
  ['skeletalMuscleKg', 'skeletal_muscle_kg'],
  ['muscleKg', 'muscle_kg'],
  ['boneKg', 'bone_kg'],
  ['bmrKcal', 'bmr_kcal'],
  ['proteinPct', 'protein_pct'],
  ['bodyAge', 'body_age'],
  ['healthScore', 'health_score'],
  ['fattyLiverLevel', 'fatty_liver_level'],
];

// 展示维度：14 项 = weightKg + 13 体成分；fatty_liver_level 存而默认不展示，出口剔除
const DISPLAY_FIELDS = BODY_FIELDS.filter(([key]) => key !== 'fattyLiverLevel');

const SELECT_COLS =
  'id, weight_kg, measured_at, source, is_morning, photo_key, ' +
  BODY_FIELDS.map(([, col]) => col).join(', ');

const SOURCES = ['manual', 'photo', 'ble'];

interface CreateWeightInput {
  weightKg?: number;
  measuredAt?: string;
  source?: string;
  isMorning?: boolean;
  clientUuid?: string;
  photoKey?: string;
  [k: string]: unknown;
}

@Injectable()
export class WeightService {
  constructor(private readonly db: DatabaseService) {}

  async create(userId: number, input: CreateWeightInput) {
    if (typeof input.weightKg !== 'number' || input.weightKg <= 0 || input.weightKg > 500) {
      throw new BadRequestException('weight_kg 需为 0-500 的数值');
    }
    if (!input.source || !SOURCES.includes(input.source)) {
      throw new BadRequestException('source 仅支持 manual/photo/ble');
    }

    const cols = ['user_id', 'weight_kg', 'measured_at', 'source', 'is_morning'];
    const vals: unknown[] = [
      userId,
      input.weightKg,
      input.measuredAt ? new Date(input.measuredAt) : new Date(),
      input.source,
      input.isMorning === true,
    ];
    if (input.photoKey) {
      cols.push('photo_key');
      vals.push(input.photoKey);
    }
    if (input.clientUuid) {
      cols.push('client_uuid');
      vals.push(input.clientUuid);
    }
    for (const [key, col] of BODY_FIELDS) {
      if (input[key] !== undefined && input[key] !== null) {
        cols.push(col);
        vals.push(input[key]);
      }
    }

    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    // client_uuid 幂等：命中活跃唯一索引则返回既有行，不重复入库
    const conflict = input.clientUuid
      ? `ON CONFLICT (user_id, client_uuid) WHERE client_uuid IS NOT NULL
         DO UPDATE SET client_uuid = weight_records.client_uuid`
      : '';
    const { rows } = await this.db.query(
      `INSERT INTO weight_records (${cols.join(', ')})
       VALUES (${placeholders})
       ${conflict}
       RETURNING ${SELECT_COLS}`,
      vals,
    );
    return this.toDto(rows[0]);
  }

  /** 曲线：区间内每日保留最后一条（measured_at DESC），返回按时间升序。 */
  async list(userId: number, range?: string) {
    const cutoff = this.rangeCutoff(range);
    const { rows } = await this.db.query(
      `SELECT DISTINCT ON (measured_at::date) ${SELECT_COLS}
       FROM weight_records
       WHERE user_id = $1 AND ($2::timestamptz IS NULL OR measured_at >= $2)
       ORDER BY measured_at::date DESC, measured_at DESC`,
      [userId, cutoff],
    );
    return rows.map((r) => this.toDto(r)).reverse();
  }

  /** S4 主页今晨体重：最近一条 + 是否今日。 */
  async latest(userId: number) {
    const { rows } = await this.db.query(
      `SELECT ${SELECT_COLS}, (measured_at::date = current_date) AS is_today
       FROM weight_records WHERE user_id = $1
       ORDER BY measured_at DESC LIMIT 1`,
      [userId],
    );
    if (!rows.length) return { record: null, isToday: false };
    return { record: this.toDto(rows[0]), isToday: rows[0].is_today === true };
  }

  /** 14 维对比：默认最近两条（to=最新, from=次新），或指定 from/to 记录 id。 */
  async compare(userId: number, fromId?: number, toId?: number) {
    let fromRow: Record<string, unknown> | null = null;
    let toRow: Record<string, unknown> | null = null;

    if (fromId && toId) {
      fromRow = await this.getOwned(userId, fromId);
      toRow = await this.getOwned(userId, toId);
    } else {
      const { rows } = await this.db.query(
        `SELECT ${SELECT_COLS} FROM weight_records
         WHERE user_id = $1 ORDER BY measured_at DESC LIMIT 2`,
        [userId],
      );
      toRow = rows[0] ?? null;
      fromRow = rows[1] ?? null;
    }

    const from = fromRow ? this.toDto(fromRow) : null;
    const to = toRow ? this.toDto(toRow) : null;
    const deltas: Record<string, number | null> = {};
    if (from && to) {
      for (const [key] of [['weightKg'], ...DISPLAY_FIELDS] as Array<[string]>) {
        const a = from[key] as number | null;
        const b = to[key] as number | null;
        deltas[key] = a != null && b != null ? Number((b - a).toFixed(2)) : null;
      }
    }
    return { from, to, deltas };
  }

  private async getOwned(userId: number, id: number) {
    const { rows } = await this.db.query(
      `SELECT ${SELECT_COLS} FROM weight_records WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    if (!rows.length) throw new NotFoundException(`称重记录 ${id} 不存在`);
    return rows[0];
  }

  private rangeCutoff(range?: string): Date | null {
    if (!range || range === 'all') return null;
    const m = /^(\d+)d$/.exec(range);
    if (!m) throw new BadRequestException('range 仅支持 7d/30d/90d/all');
    const days = Number(m[1]);
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }

  private toDto(row: Record<string, unknown>) {
    const num = (v: unknown) => (v == null ? null : Number(v));
    const dto: Record<string, unknown> = {
      id: Number(row.id),
      weightKg: num(row.weight_kg),
      measuredAt: row.measured_at,
      source: row.source,
      isMorning: row.is_morning,
      photoKey: row.photo_key ?? null,
    };
    // 出口仅 13 项体成分（fatty_liver_level 存而不展示）
    for (const [key, col] of DISPLAY_FIELDS) {
      dto[key] = num(row[col]);
    }
    return dto;
  }
}
