import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConsentService } from './consent.service';

@UseGuards(JwtAuthGuard)
@Controller('me/consents')
export class ConsentController {
  constructor(private readonly consent: ConsentService) {}

  @Get()
  list(@CurrentUser() userId: number) {
    return this.consent.status(userId);
  }

  @Post()
  grant(
    @CurrentUser() userId: number,
    @Body() body: { type?: string; version?: string },
  ) {
    return this.consent.grant(userId, body?.type ?? '', body?.version ?? '');
  }

  @Delete(':type')
  revoke(@CurrentUser() userId: number, @Param('type') type: string) {
    return this.consent.revoke(userId, type);
  }
}
