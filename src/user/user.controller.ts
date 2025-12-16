import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
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
    return this.userService.findByNakamaId(account.custom_id ?? '');
  }

  @ApiBearerAuth()
  @Server()
  @Get('id/:id')
  async getUserById(@Param('id') id: number) {
    return this.userService.findOne(id);
  }

  @ApiBearerAuth()
  @Server()
  @Get('oculus/:oculusId')
  async getUserByOculusId(@Param('oculusId') oculusId: string) {
    return this.userService.findByOculusId(oculusId);
  }

  @ApiBearerAuth()
  @Server()
  @Get('nakama/:customId')
  async getUserByNakamaId(@Param('customId') customId: string) {
    return this.userService.findByNakamaId(customId);
  }

  @ApiBearerAuth()
  @Server()
  @Get(':username')
  async getUserByName(@Param('username') username: string) {
    return this.userService.findByName(username);
  }

  @ApiBearerAuth()
  @Server()
  @Patch(':customId')
  async updateUser(
    @Param('customId') customId: string,
    @Body() updateDto: UpdateUserDto,
  ) {
    return this.userService.update(customId, updateDto);
  }

  //   @ApiBearerAuth()
  //   @Server()
  //   @Post('syncFromNakama/all')
  //   async syncAllFromNakama(@Param('customId') customId: string) {

  //   }

  @ApiBearerAuth()
  @Server()
  @Post('syncFromNakama/:customId')
  syncOneFromNakama(@Param('customId') customId: string) {
    return this.userService.syncOneFromNakama(customId);
  }
}
