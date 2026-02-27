import { ConfigKey, ConfigTable, ConfigYaml } from '../table';

export type StoreGainInfo = number | {
  amount?: number;
  gainTo?: 'Drop' | 'Chest';
  meta?: {
    [key: string]: any;
  };
};

export class Store extends ConfigTable {
  key: string = '';
  gain: {
    [key: string]: StoreGainInfo
  } = {};
  cost: {
    [key: string]: number
  } = {};

  constructor() {
    super();
    ConfigKey()(this, 'key');
    ConfigYaml()(this, 'gain');
    ConfigYaml()(this, 'cost');
  }
}

export function storeGainToCost(gain: Record<string, StoreGainInfo>): Record<string, number> {
  const cost: Record<string, number> = {};
  for (const key in gain) {
    cost[key] = typeof gain[key] === 'number' ? gain[key] : gain[key].amount || 1;
  }
  return cost;
}

export function storeGainInfoToCount(info: StoreGainInfo): number {
  return typeof info === 'number' ? info : info.amount || 1;
}

export function forceRefreshToChest(info: StoreGainInfo): boolean {
  return typeof info === 'object' && info.gainTo === 'Chest';
}

export function storeGainInfoMeta(info: StoreGainInfo): Record<string, any> {
  return typeof info === 'object' && info.meta ? info.meta : {};
}

