/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { NakamaService } from 'src/nakama/nakama.service';
import { AuthenticateOculusDto } from './dto/authenticate-oculus.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatwoUser } from 'src/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly nakamaService: NakamaService,
    @InjectRepository(ChatwoUser)
    private readonly userRepository: Repository<ChatwoUser>,
  ) {}

  private async getOculusUser(accessToken: string) {
    const resp = await fetch(
      `https://graph.oculus.com/me?access_token=${accessToken}&fields=id,alias`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    if (!resp.ok) {
      throw new UnauthorizedException('Invalid Oculus access token');
    }
    const data = await resp.json();
    return data as { id: string; alias: string };
  }

  async authenticateOculus(signInOculusDto: AuthenticateOculusDto) {
    const user = await this.getOculusUser(signInOculusDto.access_token);
    let chatwoUser = await this.userRepository.findOne({
      where: { oculusId: user.id },
    });
    if (!chatwoUser) {
      const newUser = this.userRepository.create({
        oculusId: user.id, // Assuming nakamaId is the same as oculusId for new users
        name: signInOculusDto.username ?? user.alias,
      });
      chatwoUser = await this.userRepository.save(newUser);
    }
    return this.nakamaService.authenticate(
      chatwoUser.nakamaId,
      signInOculusDto.username ?? user.alias,
    );
  }

  async oculusExists(id: string): Promise<boolean> {
    const chatwoUser = await this.userRepository.findOne({
      where: { oculusId: id },
    });
    return !!chatwoUser;
  }
}
