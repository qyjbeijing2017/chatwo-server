import { ConfigKey, ConfigTable, ConfigYaml } from '../table';
import { StoreGainInfo } from './store';

export class Redeem extends ConfigTable {
    code: string = '';
    gain: {
        [key: string]: StoreGainInfo
    } = {};
    constructor() {
        super();
        ConfigKey()(this, 'code');
        ConfigYaml()(this, 'gain');
    }
}
