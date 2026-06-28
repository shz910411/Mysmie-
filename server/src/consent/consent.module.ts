import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DevOnlyGuard } from '../common/dev-only.guard';
import { ConsentController } from './consent.controller';
import { ConsentService } from './consent.service';
import { HealthConsentGuard } from './health-consent.guard';
import { HealthGateProbeController } from './health-gate-probe.controller';

@Module({
  imports: [AuthModule],
  controllers: [ConsentController, HealthGateProbeController],
  providers: [ConsentService, HealthConsentGuard, DevOnlyGuard],
  exports: [ConsentService, HealthConsentGuard],
})
export class ConsentModule {}
