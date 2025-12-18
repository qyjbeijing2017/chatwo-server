import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { ItemService } from './item.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Account } from 'src/auth/Account.decorator';
import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { Server } from 'src/auth/server.decorator';
import { DropItemInDto } from './dto/drop-in.dto';

@Controller('item')
export class ItemController {
  constructor(private readonly itemService: ItemService) { }

  @ApiBearerAuth()
  @Get('inChest')
  async getChestItems(
    @Account() account: ApiAccount,
  ) {
    return this.itemService.getChestItems(account);
  }

  @ApiBearerAuth()
  @Post('dropIn/:nakamaId')
  async dropItemIn(
    @Account() account: ApiAccount,
    @Param('nakamaId') nakamaId: string,
    @Body() dto: DropItemInDto,
  ) {
    return this.itemService.dropItemIn(account, nakamaId, dto);
  }


  @ApiBearerAuth()
  @Get('container')
  async getContainers(
    @Account() account: ApiAccount,
  ) {
    return this.itemService.getContainers(account);
  }
}
