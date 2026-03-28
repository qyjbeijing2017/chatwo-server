import { ApiAccount } from "@heroiclabs/nakama-js/dist/api.gen";
import { UserEvent } from "./user.event";
import { ChatwoStatistic } from "src/entities/statistic.entity";

export class StatisticEvent extends UserEvent {
    constructor(
        public readonly eventId: string,
        public readonly account: ApiAccount,
        public readonly statistic: ChatwoStatistic,
        public readonly payload: any = {},
    ) {
        super(eventId, account);
    }
}