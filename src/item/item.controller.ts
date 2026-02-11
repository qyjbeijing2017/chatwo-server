import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ItemService } from './item.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Account } from 'src/auth/Account.decorator';
import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { DropItemInDto } from './dto/drop-in.dto';
import { UpdateItemDto } from './dto/update-item.dto';

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
  @Get('equipped')
  async getEquippedItems(
    @Account() account: ApiAccount,
  ) {
    return this.itemService.getEquippedItems(account);
  }

  @ApiBearerAuth()
  @Post('equip/:pointerIndex/:nakamaId')
  async equipItem(
    @Account() account: ApiAccount,
    @Param('nakamaId') nakamaId: string,
    @Param('pointerIndex', ParseIntPipe) pointerIndex: number,
    @Body() dto: DropItemInDto,
  ) {
    return this.itemService.equipItem(account, nakamaId, pointerIndex, dto);
  }

  @ApiBearerAuth()
  @Post('unequip/:pointerIndex')
  async unequipItem(
    @Account() account: ApiAccount,
    @Param('pointerIndex', ParseIntPipe) pointerIndex: number,
  ) {
    return this.itemService.unequipItem(account, pointerIndex);
  }

  @ApiBearerAuth()
  @Patch(':nakamaId')
  async updateItem(
    @Account() account: ApiAccount,
    @Param('nakamaId') nakamaId: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.itemService.updateItem(account, nakamaId, dto);
  }

  @ApiBearerAuth()
  @Post('reset')
  async resetItems(
    @Account() account: ApiAccount,
  ) {
    await this.itemService.resetItems(account);
    await this.itemService.initItemsForNewUser(account);
  }

  @ApiBearerAuth()
  @Post('takeOut/:nakamaId')
  async takeItemOut(
    @Account() account: ApiAccount,
    @Param('nakamaId') nakamaId: string,
  ) {
    return this.itemService.takeItemOut(account, nakamaId);
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

  // @ApiBearerAuth()
  // @Delete('container/:containerId')
  // async deleteContainer(
  //   @Account() account: ApiAccount,
  //   @Param('containerId', ParseIntPipe) containerId: number,
  // ) {
  //   return this.itemService.deleteContainer(account, containerId);
  // }
}
