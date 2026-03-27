import { ApiAccount } from "@heroiclabs/nakama-js/dist/api.gen";
import { UserEvent } from "./user.event";

export class TaskFinishedEvent extends UserEvent {
    constructor(
        public readonly account: ApiAccount,
        public readonly taskId: string,
    ) {
        super('user.task-finished', account);
    }
}