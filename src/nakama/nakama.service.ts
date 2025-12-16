import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Session } from '@heroiclabs/nakama-js';
import { ChatwoItem, ItemType } from 'src/entities/item.entity';
import { configManager } from 'src/configV2/config';

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

  login(id: string) {
    return this.client.authenticateCustom(id, false);
  }

  getSession(token: string) {
    return Session.restore(token, '');
  }

  getAccount(session: Session) {
    return this.client.getAccount(session);
  }

  async getWallet(session: Session) {
    const account = await this.client.getAccount(session);
    return JSON.parse(account.wallet || '{}') as Record<string, number>;
  }

  async listItems(session: Session): Promise<Partial<ChatwoItem>[]> {
    const resp = await this.client.rpc(session, 'refresh_assets', {});
    const data = resp.payload as {
      [key: string]: {
        id: string;
        key: string;
        createdAt: string;
        updatedAt: string;
        meta: any;
      };
    };
    delete data['success']; // Remove success field

    return Object.values(data)
      .map((item) => ({
        nakamaId: item.id,
        key: item.key,
        type: configManager.itemMap.get(item.key)?.type ?? ItemType.item,
        createdAt: new Date(item.createdAt),
        meta: item.meta,
      }));
  }
}
