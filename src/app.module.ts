import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from './logger/logger.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { S3Module } from './s3/s3.module';
import { AuthModule } from './auth/auth.module';
import { NakamaModule } from './nakama/nakama.module';
import { ChatwoUser } from './entities/user.entity';
import { ChatwoItem } from './entities/item.entity';
import { ChatwoLog } from './entities/log.entity';
import { ItemModule } from './item/item.module';
import { StatisticModule } from './statistic/statistic.module';
import { UserModule } from './user/user.module';
import { ChatwoContainer } from './entities/container.entity';
import { GmModule } from './gm/gm.module';
import { StoreModule } from './store/store.module';
import { TaskModule } from './task/task.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.local', '.env.development', '.env'],
      isGlobal: true,
    }),
    LoggerModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService<NodeJS.ProcessEnv>],
      useFactory: (config: ConfigService<NodeJS.ProcessEnv>) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: parseInt(config.get('DB_PORT', '5432')),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [ChatwoUser, ChatwoItem, ChatwoLog, ChatwoContainer],
        synchronize: true, // ⚠️ 生产环境下应为 false
      }),
    }),
    S3Module,
    AuthModule,
    NakamaModule,
    ItemModule,
    StatisticModule,
    UserModule,
    GmModule,
    StoreModule,
    TaskModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
