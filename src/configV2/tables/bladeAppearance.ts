import { ConfigEnum, ConfigInt, ConfigName, ConfigTable } from '../table';

export enum BladeAppearanceType {
    v1 = 'v1',
    v10 = 'v10',
    v20 = 'v20',
}


export class BladeAppearance extends ConfigTable {
    Index: number = 0;
    Name: string = '';
    BladePath: string = '';
    MaterialPath: string = '';
    BladeKey: string = '';
    Type: BladeAppearanceType = BladeAppearanceType.v1;

    constructor() {
        super();
        ConfigInt()(this, 'Index');
        ConfigEnum({
            v1: BladeAppearanceType.v1,
            v10: BladeAppearanceType.v10,
            v20: BladeAppearanceType.v20,
        })(this, 'Type');
    }
}
