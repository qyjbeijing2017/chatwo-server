import { Module } from '@nestjs/common';
import { StatisticController } from './statistic.controller';
import { StatisticService } from './statistic.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatwoUser } from 'src/entities/user.entity';
import { ChatwoLog } from 'src/entities/log.entity';
import { ChatwoItem } from 'src/entities/item.entity';
import { NakamaModule } from 'src/nakama/nakama.module';

@Module({
  imports: [
    NakamaModule,
    TypeOrmModule.forFeature([ChatwoUser, ChatwoLog, ChatwoItem]),
  ],
  controllers: [StatisticController],
  providers: [StatisticService],
})
export class StatisticModule { }
