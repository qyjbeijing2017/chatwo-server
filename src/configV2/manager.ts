/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { defineMetadata } from '../utils/meta-data';
import { ChatwoConfigFileName } from './filesName';
import { ConfigTable } from './table';
import { ArchievementTaskConfig } from './tables/archievementTask';
import { Hilt } from './tables/hilt';
import { Item } from './tables/Items';
import { Monster } from './tables/monster';
import { Store } from './tables/store';

export function ConfigParse<T extends ConfigTable>(
  type: new () => T,
  ...paths: ChatwoConfigFileName[]
) {
  return function (target: ConfigManager, propertyKey: string) {
    defineMetadata('configManager:filePath', paths, ConfigManager, propertyKey);
    defineMetadata('configManager:parseType', type, ConfigManager, propertyKey);
  };
}

export interface ConfigManagerData {
  [key: string]: ConfigTable[];
}

export class ConfigManager {
  items: Item[] = [];
  store: Store[] = [];
  archievementTask: ArchievementTaskConfig[] = [];
  monsters: Monster[] = [];
  hilts: Hilt[] = [];
  itemMap: Map<string, Item> = new Map();
  storeMap: Map<string, Store> = new Map();
  archievementTaskMap: Map<string, ArchievementTaskConfig> = new Map();
  monsterMap: Map<string, Monster> = new Map();
  hiltMap: Map<string, Hilt> = new Map();

  constructor(data: ConfigManagerData) {
    ConfigParse(Item, 'items.csv', 'arm.csv')(this, 'items');
    ConfigParse(Store, 'store.csv')(this, 'store');
    ConfigParse(ArchievementTaskConfig, 'archievementTask.csv')(
      this,
      'archievementTask',
    );
    ConfigParse(Monster, 'monster.csv')(this, 'monsters');
    ConfigParse(Hilt, 'hilt.csv')(this, 'hilts');
    // 赋值
    for (const key in data) {
      (this as any)[key] = data[key];
    }

    // 构建map
    for (const item of this.items) {
      this.itemMap.set(item.key, item);
    }

    for (const store of this.store) {
      this.storeMap.set(store.key, store);
    }

    for (const task of this.archievementTask) {
      this.archievementTaskMap.set(task.Name, task);
    }

    for (const monster of this.monsters) {
      this.monsterMap.set(monster.Name, monster);
    }

    for (const hilt of this.hilts) {
      this.hiltMap.set(hilt.key, hilt);
    }
  }
}
