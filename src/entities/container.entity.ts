import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { ChatwoUser } from './user.entity';
import { ChatwoItem } from './item.entity';
import { Patchable, ToPatchJson } from './patchable';


export enum ContainerType {
    chest = 0,
    equipPoint1 = 1,
    equipPoint2 = 2,
    equipPoint3 = 3,
    equipPoint4 = 4,
    equipPoint5 = 5,
}

@Entity()
export class ChatwoContainer extends Patchable {
    @Column({ default: ContainerType.chest })
    type: ContainerType;

    @ToPatchJson((user: ChatwoUser) => ({ nakamaId: user.nakamaId }))
    @ManyToOne(() => ChatwoUser, (user) => user.containers, { nullable: true })
    owner: ChatwoUser;

    @OneToMany(() => ChatwoItem, (item) => item.container)
    items: ChatwoItem[];
}
