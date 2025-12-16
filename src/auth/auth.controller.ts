import {
  Body,
  Controller,
  Get,
  Head,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { Public } from './public.decorator';
import { AuthenticateOculusDto } from './dto/authenticate-oculus.dto';
import { AuthService } from './auth.service';

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
    return { exists: await this.authService.oculusExists(id) };
  }

  @Public()
  @Head('oculus/:id')
  async headOculusExists(@Param('id') id: string) {
    const exists = await this.authService.oculusExists(id);
    if (!exists) {
      throw new NotFoundException();
    }
    return { exists };
  }
}
