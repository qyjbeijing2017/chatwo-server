import { ApiAccount } from "@heroiclabs/nakama-js/dist/api.gen";
import { UserEvent } from "./user.event";

export class AddFriendEvent extends UserEvent {
    constructor(
        public readonly account: ApiAccount,
        public readonly friendName: string
    ) {
        super('user.add-friend', account);
    }
}
