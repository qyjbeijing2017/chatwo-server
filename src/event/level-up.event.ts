import { ApiAccount } from "@heroiclabs/nakama-js/dist/api.gen";
import { UserEvent } from "./user.event";
import { ChatwoItem } from "src/entities/item.entity";
import { configManager } from "src/configV2/config";

export class LevelUpEvent extends UserEvent {
    levelUpCount: number;
    levelMax: boolean;
    constructor(
        public readonly account: ApiAccount,
        public readonly item: ChatwoItem,
        public readonly startExp: number,
        public readonly endExp: number,
    ) {
        super('user.level-up', account);
        const config = configManager.levels;
        if (!config) {
            this.levelUpCount = 0;
            this.levelMax = false;
        } else {
            const startLevel = config.findIndex(level => level.Sum > this.startExp);
            const endLevel = config.findIndex(level => level.Sum > this.endExp);
            this.levelUpCount = endLevel - startLevel;
            const endLevelConfig = config[config.length - 1];
            this.levelMax = this.endExp >= endLevelConfig.Sum;
        }
    }
}
