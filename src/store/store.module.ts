import { Module } from '@nestjs/common';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatwoUser } from 'src/entities/user.entity';
import { ChatwoContainer } from 'src/entities/container.entity';
import { ChatwoItem } from 'src/entities/item.entity';
import { ItemModule } from 'src/item/item.module';
import { ChatwoReedem } from 'src/entities/reedem.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatwoUser, ChatwoContainer, ChatwoItem, ChatwoReedem]),
    ItemModule,
  ],
  controllers: [StoreController],
  providers: [StoreService],
  exports: [StoreService],
})
export class StoreModule { }
