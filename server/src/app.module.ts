import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConsentModule } from './consent/consent.module';
import { WeightModule } from './weight/weight.module';

@Module({
  imports: [DatabaseModule, AuthModule, UsersModule, ConsentModule, WeightModule],
  controllers: [HealthController],
})
export class AppModule {}
