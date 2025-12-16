import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';
import { ItemService } from './item.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Account } from 'src/auth/Account.decorator';
import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { Server } from 'src/auth/server.decorator';

@Controller('item')
export class ItemController {
  constructor(private readonly itemService: ItemService) { }


  @ApiBearerAuth()
  @Get()
  findAllByAccount(@Account() account: ApiAccount) {
    return this.itemService.findAllByCustomId(account.custom_id || '');
  }

  @ApiBearerAuth()
  @Get('gm/:name')
  @Server()
  findAllByOwner(@Param('name') name: string) {
    return this.itemService.findAllByOwner(name);
  }

  @ApiBearerAuth()
  @Get('gm')
  @Server()
  findAll() {
    return this.itemService.findAll();
  }

  @ApiBearerAuth()
  @Get('gm/withDelete')
  @Server()
  findWithDelete() {
    return this.itemService.findAllWithDeleted();
  }


}
