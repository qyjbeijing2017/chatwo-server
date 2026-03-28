import { ApiAccount } from "@heroiclabs/nakama-js/dist/api.gen";
import { UserEvent } from "./user.event";
import { ChatwoItem } from "src/entities/item.entity";
import { configManager } from "src/configV2/config";
import { clamp } from "src/utils/clamp";

export class LevelUpEvent extends UserEvent {
    levelUpCount: number;
    levelMax: boolean;
    levelStart: number;
    levelEnd: number;

    level(exp: number) {
        const config = configManager.levels;
        if (!config) return 0;
        const configCopy = [...config];
        config.pop();
        let level = 0;
        config.sort((a, b) => a.Sum - b.Sum);
        while (level < config.length && exp > config[level].Sum) {
            level++;
        }
        return level + 1;
    }

    constructor(
        public readonly account: ApiAccount,
        public readonly item: ChatwoItem,
        public readonly startExp: number,
        public readonly endExp: number,
    ) {
        super('user.level-up', account);
        this.levelStart = this.level(startExp);
        this.levelEnd = this.level(endExp);
        this.levelUpCount = clamp(this.levelEnd - this.levelStart, 0, configManager.levels.length);
        this.levelMax = this.levelEnd >= configManager.levels.length;
    }
}
