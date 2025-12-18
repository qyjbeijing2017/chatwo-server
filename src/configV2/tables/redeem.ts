import { ConfigKey, ConfigTable, ConfigYaml } from '../table';

export class Redeem extends ConfigTable {
    code: string = '';
    gain: {
        [key: string]: number;
    } = {};
    constructor() {
        super();
        ConfigKey()(this, 'code');
        ConfigYaml()(this, 'gain');
    }
}
