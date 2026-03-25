import { ApiAccount } from "@heroiclabs/nakama-js/dist/api.gen";
import { UserEvent } from "./user.event";
import { ChatwoItem } from "src/entities/item.entity";
import { configManager } from "src/configV2/config";

export class LevelUpEvent extends UserEvent {
    constructor(
        public readonly account: ApiAccount,
        public readonly item: ChatwoItem,
        public readonly startExp: number,
        public readonly endExp: number,
    ) {
        super('user.level-up', account);
    }

    get levelUpCount(): number {
        const config = configManager.levels;
        if (!config) {
            return 0;
        }
        const startLevel = config.findIndex(level => level.Sum > this.startExp);
        const endLevel = config.findIndex(level => level.Sum > this.endExp);
        return endLevel - startLevel;
    }

}
