import { ConfigInt, ConfigTable } from '../table';


export class Level extends ConfigTable {
    Level: number = 0;
    Exp: number = 0;
    Sum: number = 0;

    constructor() {
        super();
        ConfigInt()(this, 'Level');
        ConfigInt()(this, 'Exp');
        ConfigInt()(this, 'Sum');
    }
}
