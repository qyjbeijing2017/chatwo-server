import { ApiAccount } from "@heroiclabs/nakama-js/dist/api.gen";
import { UserEvent } from "./user.event";
import { ChatwoItem } from "src/entities/item.entity";

export class ForgeEvent extends UserEvent {
    constructor(
        public readonly account: ApiAccount,
        public readonly item: ChatwoItem,
    ) {
        super('user.forge', account);
    }
}
