import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
} from 'typeorm';
import { ChatwoUser } from './user.entity';
import { ChatwoItem } from './item.entity';


export enum ContainerType {
    chest = 0,
    equipPoint1 = 1,
    equipPoint2 = 2,
    equipPoint3 = 3,
    equipPoint4 = 4,
    equipPoint5 = 5,
}

@Entity()
export class ChatwoContainer {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: ContainerType.chest })
    type: ContainerType;

    @ManyToOne(() => ChatwoUser, (user) => user.containers, { nullable: true })
    owner: ChatwoUser;

    @OneToMany(() => ChatwoItem, (item) => item.container)
    items: ChatwoItem[];
}
