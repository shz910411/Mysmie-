import 'dotenv/config'; // 先加载 server/.env 到 process.env
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { validateEnv } from './config/env.validation';

async function bootstrap() {
  validateEnv(); // 缺必填环境变量则 fail-fast 退出
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
}
bootstrap();
