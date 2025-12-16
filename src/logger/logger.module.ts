import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Module({
  imports: [
    ConfigModule,
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService<NodeJS.ProcessEnv>],
      useFactory: (configService: ConfigService) => {
        const logDir = configService.get<string>('LOG_DIR', 'logs');
        const level = configService.get<string>('LOG_LEVEL', 'info');
        const appName = configService.get<string>('APP_NAME', 'app');

        return {
          transports: [
            new winston.transports.Console({
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.colorize(),
                winston.format.simple(),
              ),
              level,
            }),
            new winston.transports.DailyRotateFile({
              dirname: logDir,
              filename: `${appName}-%DATE%.log`,
              datePattern: 'YYYY-MM-DD',
              zippedArchive: true,
              maxSize: '20m',
              maxFiles: '14d',
              level,
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
              ),
            }),
          ],
        };
      },
    }),
  ],
  exports: [WinstonModule],
  controllers: [],
  providers: [],
})
export class LoggerModule {}
