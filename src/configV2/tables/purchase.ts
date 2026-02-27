import { ConfigEnum, ConfigTable, ConfigYaml } from '../table';
import { StoreGainInfo } from './store';

export enum PruchaseType {
  Durable = 'Durable',
  Consumable = 'Consumable',
  Subscription = 'Subscription',
}

export class Purchase extends ConfigTable {
  sku: string = '';
  name: string = '';
  type: PruchaseType = PruchaseType.Durable;
  gain: {
    [key: string]: StoreGainInfo
  } = {};
  constructor() {
    super();
    ConfigEnum({
      Durable: PruchaseType.Durable,
      Consumable: PruchaseType.Consumable,
      Subscription: PruchaseType.Subscription,
    })(this, 'type');
    ConfigYaml()(this, 'gain');
  }
}
