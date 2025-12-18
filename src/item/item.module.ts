import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemController } from './item.controller';
import { ItemService } from './item.service';
import { ChatwoItem } from '../entities/item.entity';
import { ChatwoUser } from '../entities/user.entity';
import { ChatwoLog } from '../entities/log.entity';
import { ChatwoContainer } from '../entities/container.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatwoItem, ChatwoUser, ChatwoLog, ChatwoContainer])],
  controllers: [ItemController],
  providers: [ItemService],
  exports: [ItemService],
})
export class ItemModule {}
