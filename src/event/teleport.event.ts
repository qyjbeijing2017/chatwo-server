import { ApiAccount } from "@heroiclabs/nakama-js/dist/api.gen";
import { UserEvent } from "./user.event";

export class TeleportEvent extends UserEvent {
    constructor(
        public readonly account: ApiAccount,
        public readonly destination: string
    ) {
        super('user.teleport', account);
    }
}
