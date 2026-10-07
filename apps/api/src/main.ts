import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const config = app.get(AppConfigService);

  app.setGlobalPrefix('v1');
  app.use(helmet());
  app.enableCors({ origin: config.corsOrigins, credentials: true });
  app.enableShutdownHooks();

  await app.listen(config.port);
}

void bootstrap();
