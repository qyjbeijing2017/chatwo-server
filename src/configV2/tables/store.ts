import { ConfigKey, ConfigTable, ConfigYaml } from '../table';

export class Store extends ConfigTable {
  key: string = '';
  gain: {
    [key: string]: number;
  } = {};
  cost: {
    [key: string]: number;
  } = {};

  constructor() {
    super();
    ConfigKey()(this, 'key');
    ConfigYaml()(this, 'gain');
    ConfigYaml()(this, 'cost');
  }
}
