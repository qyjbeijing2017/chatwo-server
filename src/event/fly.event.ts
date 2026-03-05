import { ApiAccount } from "@heroiclabs/nakama-js/dist/api.gen";
import { UserEvent } from "./user.event";

export class FlyEvent extends UserEvent {
    constructor(
        public readonly account: ApiAccount,
        public readonly meters: number
    ) {
        super('user.fly', account);
    }
}
