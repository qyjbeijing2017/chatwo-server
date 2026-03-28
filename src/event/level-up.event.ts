import { ApiAccount } from "@heroiclabs/nakama-js/dist/api.gen";
import { UserEvent } from "./user.event";
import { ChatwoItem } from "src/entities/item.entity";
import { configManager } from "src/configV2/config";
import { clamp } from "src/utils/clamp";

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
            const endLevelConfig = config[config.length - 1];
            const startLevel = config.findIndex(level => level.Sum > clamp(this.startExp, 0, endLevelConfig.Sum));
            const endLevel = config.findIndex(level => level.Sum > clamp(this.endExp, 0, endLevelConfig.Sum));
            this.levelUpCount = endLevel - startLevel;
            this.levelMax = this.endExp >= endLevelConfig.Sum;
            console.log(`endLevelConfig: ${JSON.stringify(endLevelConfig)}`);
            console.log(`config: ${JSON.stringify(config)}`);
            console.log(`startExp: ${this.startExp}, endExp: ${this.endExp}, startLevel: ${startLevel}, endLevel: ${endLevel}, levelUpCount: ${this.levelUpCount}, levelMax: ${this.levelMax}`);
        }
    }
}
