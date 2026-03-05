import { ApiAccount } from "@heroiclabs/nakama-js/dist/api.gen";
import { UserEvent } from "./user.event";

export class SignInEvent extends UserEvent {
    constructor(
        public readonly account: ApiAccount
    ) {
        super('user.sign-in', account);
    }
}
