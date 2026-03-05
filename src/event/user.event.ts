import { ApiAccount } from "@heroiclabs/nakama-js/dist/api.gen";
import { ChatwoEvent } from "./base.event";

export class UserEvent extends ChatwoEvent {
    constructor(
        public readonly eventId: string,
        public readonly account: ApiAccount
    ) {
        super(eventId);
    }
}