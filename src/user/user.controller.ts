import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { Account } from 'src/auth/Account.decorator';
import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { Server } from 'src/auth/server.decorator';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiBearerAuth()
  @Get()
  async getUserStats(@Account() account: ApiAccount) {
    return this.userService.findByName(account.custom_id || '');
  }

  @ApiBearerAuth()
  @Server()
  @Get('gm/:name')
  async getUserByName(@Param('name') name: string) {
    return this.userService.findByName(name);
  }

  @ApiBearerAuth()
  @Server()
  @Patch('gm/:name')
  async updateUser(
    @Param('name') name: string,
    @Body() updateDto: UpdateUserDto,
  ) {
    return this.userService.update(name, updateDto);
  }

  @ApiBearerAuth()
  @Post('gm/syncFromNakama/:customId')
  @Server()
  async syncFromNakama(@Param('customId') customId: string) {
    return this.userService.syncFromNakama(customId);
  }

  @ApiBearerAuth()
  @Delete('gm/:customId')
  async deleteUser(@Param('customId') customId: string) {
    return this.userService.remove(customId);
  }
}
