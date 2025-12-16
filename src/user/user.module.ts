import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { ChatwoUser } from '../entities/user.entity';
import { ChatwoLog } from 'src/entities/log.entity';
import { NakamaModule } from 'src/nakama/nakama.module';
import { ChatwoItem } from 'src/entities/item.entity';

@Module({
  imports: [
    NakamaModule,
    TypeOrmModule.forFeature([ChatwoUser, ChatwoLog, ChatwoItem]),
  ],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
