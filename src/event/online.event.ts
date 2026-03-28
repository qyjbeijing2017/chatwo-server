import { ApiAccount } from "@heroiclabs/nakama-js/dist/api.gen";
import { UserEvent } from "./user.event";

export class OnlineEvent extends UserEvent {
    constructor(
        public readonly account: ApiAccount,
        public readonly minutes: number
    ) {
        super('user.online', account);
    }
}
