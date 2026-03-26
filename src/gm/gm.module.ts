import { Module } from '@nestjs/common';
import { GmController } from './gm.controller';
import { GmService } from './gm.service';
import { NakamaModule } from 'src/nakama/nakama.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatwoUser } from 'src/entities/user.entity';
import { ChatwoContainer } from 'src/entities/container.entity';
import { ChatwoItem } from 'src/entities/item.entity';
import { StatisticModule } from 'src/statistic/statistic.module';
import { ItemModule } from 'src/item/item.module';
import { PurchaseModule } from 'src/purchase/purchase.module';
import { ChatwoTask } from 'src/entities/task.entity';
import { LoggerModule } from 'src/logger/logger.module';

@Module({
  imports: [
    NakamaModule,
    StatisticModule,
    ItemModule,
    PurchaseModule,
    LoggerModule,
    TypeOrmModule.forFeature([ChatwoUser, ChatwoContainer, ChatwoItem, ChatwoTask]),
  ],
  controllers: [GmController],
  providers: [GmService]
})
export class GmModule { }
