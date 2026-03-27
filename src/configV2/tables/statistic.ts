import { ConfigEnum, ConfigTable, ConfigYaml } from '../table';


export enum StatisticRefreshType {
    never = 0,
    daily = 1,
    weekly = 2,
    monthly = 3,
    yearly = 4,
}

export class Statistic extends ConfigTable {
    Name: string = '';
    RefreshType: StatisticRefreshType = StatisticRefreshType.never;
    Rule: {
        [key: string]: string | string[];
    } = {};

    constructor() {
        super();
        ConfigEnum({
            never: StatisticRefreshType.never,
            daily: StatisticRefreshType.daily,
            weekly: StatisticRefreshType.weekly,
            monthly: StatisticRefreshType.monthly,
            yearly: StatisticRefreshType.yearly,
        })(this, 'RefreshType');
        ConfigYaml()(this, 'Rule');
    }
}
