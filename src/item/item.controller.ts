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


}
