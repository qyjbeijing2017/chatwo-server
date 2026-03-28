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
        const levels = configManager.levels;
        if (!levels?.length) return 1;

        const sortedLevels = [...levels].sort((a, b) => a.Level - b.Level);
        let currentLevel = sortedLevels[0].Level;
        let requiredExp = 0;

        for (const lv of sortedLevels) {
            if (lv.Exp <= 0) {
                break;
            }

            requiredExp += lv.Exp;
            if (exp >= requiredExp) {
                currentLevel = lv.Level + 1;
            } else {
                break;
            }
        }

        return Math.min(currentLevel, sortedLevels[sortedLevels.length - 1].Level);
    }

    constructor(
        public readonly account: ApiAccount,
        public readonly item: ChatwoItem,
        public readonly startExp: number,
        public readonly endExp: number,
    ) {
        super('user.level-up', account);
        const maxLevel = configManager.levels.reduce((max, lv) => Math.max(max, lv.Level), 1);
        this.levelStart = this.level(startExp);
        this.levelEnd = this.level(endExp);
        this.levelUpCount = clamp(this.levelEnd - this.levelStart, 0, maxLevel);
        this.levelMax = this.levelStart < maxLevel && this.levelEnd >= maxLevel;
    }
}
