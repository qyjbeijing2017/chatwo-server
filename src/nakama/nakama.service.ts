import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Session } from '@heroiclabs/nakama-js';

@Injectable()
export class NakamaService {
  readonly client: Client;
  constructor(
    private readonly configService: ConfigService<NodeJS.ProcessEnv>,
  ) {
    this.client = new Client(
      this.configService.get('NAKAMA_SERVER_KEY'),
      this.configService.get('NAKAMA_HOST'),
      this.configService.get('NAKAMA_PORT'),
      this.configService.get('NAKAMA_USE_SSL') === 'true',
    );
  }

  authenticate(id: string, username?: string) {
    return this.client.authenticateCustom(id, true, username);
  }

  getSession(token: string) {
    return Session.restore(token, '');
  }

  getAccount(session: Session) {
    return this.client.getAccount(session);
  }
}
