import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { Account } from 'src/auth/Account.decorator';
import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { Server } from 'src/auth/server.decorator';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @ApiBearerAuth()
  @Get()
  async getUserStats(@Account() account: ApiAccount) {
    return this.userService.findByNakamaId(account.custom_id || '');
  }

  @ApiBearerAuth()
  @Post('gm/syncFromNakama/:customId')
  @Server()
  async syncFromNakama(@Param('customId') customId: string) {
    return this.userService.syncOneFromNakama(customId);
  }

  @ApiBearerAuth()
  @Post('gm/syncFromNakama')
  @Server()
  async syncAllFromNakama() {
    return this.userService.syncAllFromNakama();
  }

}
