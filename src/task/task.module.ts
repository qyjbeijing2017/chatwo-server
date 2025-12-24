import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatwoUser } from 'src/entities/user.entity';
import { ChatwoLog } from 'src/entities/log.entity';
import { ChatwoContainer } from 'src/entities/container.entity';
import { ChatwoItem } from 'src/entities/item.entity';
import { StatisticModule } from 'src/statistic/statistic.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatwoUser, ChatwoLog, ChatwoContainer, ChatwoItem]),
    StatisticModule,
  ],
  providers: [TaskService],
  controllers: [TaskController]
})
export class TaskModule { }
