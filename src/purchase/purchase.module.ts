import { Module } from '@nestjs/common';
import { PurchaseController } from './purchase.controller';
import { PurchaseService } from './purchase.service';
import { NakamaModule } from 'src/nakama/nakama.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatwoUser } from 'src/entities/user.entity';
import { ChatwoLog } from 'src/entities/log.entity';
import { ChatwoContainer } from 'src/entities/container.entity';
import { ChatwoItem } from 'src/entities/item.entity';
import { ItemModule } from 'src/item/item.module';

@Module({
  imports: [
    NakamaModule,
    TypeOrmModule.forFeature([ChatwoUser, ChatwoLog, ChatwoContainer, ChatwoItem]),
    ItemModule,
  ],
  controllers: [PurchaseController],
  providers: [PurchaseService],
  exports: [PurchaseService],
})
export class PurchaseModule { }
