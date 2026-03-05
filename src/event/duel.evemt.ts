import { ApiAccount } from "@heroiclabs/nakama-js/dist/api.gen";
import { UserEvent } from "./user.event";

export class DuelEvent extends UserEvent {
    constructor(
        public readonly account: ApiAccount,
        public readonly whoWasKilled: string
    ) {
        super('user.duel', account);
    }
}
