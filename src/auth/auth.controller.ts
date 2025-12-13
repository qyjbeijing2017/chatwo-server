import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Public } from './public.decorator';
import { AuthenticateOculusDto } from './dto/authenticate-oculus.dto';
import { AuthService } from './auth.service';
import { Server } from './server.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Public()
  @Post('oculus')
  authenticateOculus(@Body() authenticateOculusDto: AuthenticateOculusDto) {
    return this.authService.authenticateOculus(authenticateOculusDto);
  }

  @Public()
  @Get('oculus/:id/exists')
  async oculusExists(@Param('id') id: string) {
    return this.authService.oculusExists(id);
  }

  @ApiBearerAuth()
  @Server()
  @Get('users')
  async getUsers() {
    return this.authService.getUsers();
  }
}
