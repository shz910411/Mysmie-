import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConsentModule } from '../consent/consent.module';
import { WeightController } from './weight.controller';
import { WeightService } from './weight.service';

@Module({
  imports: [AuthModule, ConsentModule], // JwtAuthGuard + HealthConsentGuard
  controllers: [WeightController],
  providers: [WeightService],
})
export class WeightModule {}
