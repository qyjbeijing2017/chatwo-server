import { EventEmitter2 } from "@nestjs/event-emitter";

export class ChatwoEvent {
    static emit(emitter: EventEmitter2, event: ChatwoEvent) {
        emitter.emit(event.eventId, event);
    }
    constructor(public readonly eventId: string) { }
}