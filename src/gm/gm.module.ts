import { Module } from '@nestjs/common';
import { GmController } from './gm.controller';
import { GmService } from './gm.service';
import { NakamaModule } from 'src/nakama/nakama.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatwoUser } from 'src/entities/user.entity';
import { ChatwoLog } from 'src/entities/log.entity';
import { ChatwoContainer } from 'src/entities/container.entity';
import { ChatwoItem } from 'src/entities/item.entity';

@Module({
  imports: [
    NakamaModule,
    TypeOrmModule.forFeature([ChatwoUser, ChatwoLog, ChatwoContainer, ChatwoItem]),
  ],
  controllers: [GmController],
  providers: [GmService]
})
export class GmModule { }
