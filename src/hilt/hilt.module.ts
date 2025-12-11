import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HiltController } from './hilt.controller';
import { HiltService } from './hilt.service';
import { ChatwoHilt } from '../entities/hilt.entity';
import { ChatwoUser } from 'src/entities/user.entity';
import { ChatwoBlade } from 'src/entities/blade.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatwoHilt, ChatwoUser, ChatwoBlade])],
  controllers: [HiltController],
  providers: [HiltService],
  exports: [HiltService],
})
export class HiltModule {}
