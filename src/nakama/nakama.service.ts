import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, Session } from '@heroiclabs/nakama-js';
import { ChatwoItem } from 'src/entities/item.entity';
import { v4 } from 'uuid';

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

  async listItems(session: Session) {
    const objs = await this.client.readStorageObjects(session, {
      object_ids: [
        {
          collection: 'user_items',
          key: 'user_persistence',
        },
        {
          collection: 'user_items',
          key: 'items',
        },
        {
          collection: 'assets',
          key: 'items',
        },
      ],
    });
    const [userPersistenceObj, userItemsObj, assetItemsObj] = objs.objects;
    const assetItems: {
      [key: string]: {
        id: string;
        key: string;
        metadata: any;
      };
    } = assetItemsObj.value || {};
    const userPersistence: { [key: string]: any } =
      userPersistenceObj.value || {};
    const userItems: { [key: string]: number } = userItemsObj.value || {};
  }
}
