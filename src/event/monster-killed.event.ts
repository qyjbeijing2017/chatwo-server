import { ApiAccount } from "@heroiclabs/nakama-js/dist/api.gen";
import { UserEvent } from "./user.event";

export class MonsterKilledEvent extends UserEvent {
    constructor(
        public readonly account: ApiAccount,
        public readonly monsterId: string
    ) {
        super('user.monster-killed', account);
    }
}
