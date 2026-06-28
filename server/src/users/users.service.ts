import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface ProfileInput {
  gender?: string;
  age?: number;
  heightCm?: number;
  targetWeightKg?: number;
}

interface ProfileRow {
  gender: string | null;
  birth_year: number | null;
  height_cm: string | null;
  target_weight_kg: string | null;
  nickname: string | null;
}

const GENDERS = ['male', 'female', 'other'];

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async getProfile(userId: number) {
    const { rows } = await this.db.query<ProfileRow>(
      `SELECT gender, birth_year, height_cm, target_weight_kg, nickname
       FROM users WHERE id = $1`,
      [userId],
    );
    if (!rows.length) throw new NotFoundException('用户不存在');
    return this.toDto(rows[0]);
  }

  async updateProfile(userId: number, input: ProfileInput) {
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (input.gender !== undefined) {
      if (!GENDERS.includes(input.gender)) {
        throw new BadRequestException('gender 仅支持 male/female/other');
      }
      sets.push(`gender = $${i++}`);
      params.push(input.gender);
    }

    if (input.age !== undefined) {
      if (!Number.isInteger(input.age) || input.age < 1 || input.age > 120) {
        throw new BadRequestException('年龄需为 1-120 的整数');
      }
      const birthYear = new Date().getFullYear() - input.age;
      sets.push(`birth_year = $${i++}`);
      params.push(birthYear);
    }

    if (input.heightCm !== undefined) {
      if (typeof input.heightCm !== 'number' || input.heightCm < 50 || input.heightCm > 250) {
        throw new BadRequestException('身高需为 50-250cm');
      }
      sets.push(`height_cm = $${i++}`);
      params.push(input.heightCm);
    }

    if (input.targetWeightKg !== undefined) {
      if (typeof input.targetWeightKg !== 'number' || input.targetWeightKg < 20 || input.targetWeightKg > 300) {
        throw new BadRequestException('目标体重需为 20-300kg');
      }
      sets.push(`target_weight_kg = $${i++}`);
      params.push(input.targetWeightKg);
    }

    if (sets.length === 0) {
      throw new BadRequestException('无可更新字段');
    }

    sets.push('updated_at = now()');
    params.push(userId);
    await this.db.query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${i}`,
      params,
    );
    return this.getProfile(userId);
  }

  private toDto(row: ProfileRow) {
    const year = new Date().getFullYear();
    return {
      gender: row.gender,
      birthYear: row.birth_year,
      age: row.birth_year != null ? year - row.birth_year : null,
      heightCm: row.height_cm != null ? Number(row.height_cm) : null,
      targetWeightKg: row.target_weight_kg != null ? Number(row.target_weight_kg) : null,
      nickname: row.nickname,
    };
  }
}
