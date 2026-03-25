import { Module } from '@nestjs/common';
import { StatisticController } from './statistic.controller';
import { StatisticService } from './statistic.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatwoUser } from 'src/entities/user.entity';
import { ChatwoLog } from 'src/entities/log.entity';
import { ChatwoItem } from 'src/entities/item.entity';
import { NakamaModule } from 'src/nakama/nakama.module';
import { ChatwoContainer } from 'src/entities/container.entity';
import { ChatwoBug } from 'src/entities/bug.entity';
import { ChatwoTask } from 'src/entities/task.entity';
import { ChatwoStatistic } from 'src/entities/statistic.entity';

@Module({
  imports: [
    NakamaModule,
    TypeOrmModule.forFeature([ChatwoUser, ChatwoLog, ChatwoContainer, ChatwoItem, ChatwoBug, ChatwoTask, ChatwoStatistic]),
  ],
  controllers: [StatisticController],
  providers: [StatisticService],
  exports: [StatisticService],
})
export class StatisticModule { }
