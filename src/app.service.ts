import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService<NodeJS.ProcessEnv>) {}
  getHello(): string {
    return `Hey there! Welcome to ${this.configService.get('APP_NAME')}!`;
  }
}
