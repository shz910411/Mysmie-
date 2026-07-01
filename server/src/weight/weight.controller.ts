import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HealthConsentGuard } from '../consent/health-consent.guard';
import { WeightService } from './weight.service';

// 称重全接口挂健康同意守卫：未同意 health_data → 403（对齐 M1-008）
@UseGuards(JwtAuthGuard, HealthConsentGuard)
@Controller()
export class WeightController {
  constructor(private readonly weight: WeightService) {}

  @Post('weights')
  create(@CurrentUser() userId: number, @Body() body: Record<string, unknown>) {
    return this.weight.create(userId, body);
  }

  @Get('weights')
  list(@CurrentUser() userId: number, @Query('range') range?: string) {
    return this.weight.list(userId, range);
  }

  @Get('me/weight/latest')
  latest(@CurrentUser() userId: number) {
    return this.weight.latest(userId);
  }

  @Get('me/weight-compare')
  compare(
    @CurrentUser() userId: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.weight.compare(
      userId,
      from ? Number(from) : undefined,
      to ? Number(to) : undefined,
    );
  }
}
