import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatwoAstContext } from 'src/dsl';
import { ChatwoContainer } from 'src/entities/container.entity';
import { ChatwoItem } from 'src/entities/item.entity';
import { ChatwoLog } from 'src/entities/log.entity';
import { ChatwoUser } from 'src/entities/user.entity';
import { Any, ArrayContainedBy, ArrayContains, Between, DataSource, EntityManager, ILike, In, IsNull, LessThan, LessThanOrEqual, Like, MoreThan, MoreThanOrEqual, Not, Raw, Repository } from 'typeorm';

@Injectable()
export class TaskService {
    readonly dslContext: ChatwoAstContext;
    constructor(
        @InjectRepository(ChatwoLog)
        private readonly logRepository: Repository<ChatwoLog>,
        @InjectRepository(ChatwoUser)
        private readonly userRepository: Repository<ChatwoUser>,
        @InjectRepository(ChatwoItem)
        private readonly itemRepository: Repository<ChatwoItem>,
        @InjectRepository(ChatwoContainer)
        private readonly containerRepository: Repository<ChatwoContainer>,
    ) {
        this.dslContext = {
            async query(from, select, where, join, orderBy, limit, offset) {
                const take = Math.min(Number(limit) || 100, 100);
                const skip = Number(offset) || 0;
                console.log('DSL Query:', { from, select, where, join, orderBy, limit: take, offset: skip });
                switch (from) {
                    case 'log':
                        return logRepository.find({
                            select: select,
                            where: where,
                            order: orderBy,
                            skip,
                            take,
                            relations: join,
                        });
                    case 'user':
                        return userRepository.find({
                            select: select,
                            where: where,
                            order: orderBy,
                            skip,
                            take,
                            relations: join,
                        });
                    case 'item':
                        return itemRepository.find({
                            select: select,
                            where: where,
                            order: orderBy,
                            skip,
                            take,
                            relations: join,
                        });
                    case 'container':
                        return containerRepository.find({
                            select: select,
                            where: where,
                            order: orderBy,
                            skip,
                            take,
                            relations: join,
                        });
                    default:
                        throw new Error(`Unknown from type: ${from}`);
                }
            },
            queryWhere(operator, value) {
                console.log('DSL Query Where:', { operator, value });
                switch (operator) {
                    case "=":
                        return value;
                    case "!=":
                        return Not(value);
                    case ">":
                        return MoreThan(value);
                    case "<":
                        return LessThan(value);
                    case ">=":
                        return MoreThanOrEqual(value);
                    case "<=":
                        return LessThanOrEqual(value);
                    case "LIKE":
                        return Like(value);
                    case "ILIKE":
                        return ILike(value);
                    case "IN":
                        return In(value);
                    case "@>":
                        return ArrayContains(value);
                    case "<@":
                        return ArrayContainedBy(value);
                    case "ISNULL":
                        return IsNull();
                    case "BETWEEN":
                        return Between(value[0], value[1]);
                    case "ANY":
                        return Any(value);
                    case "RAW":
                        return Raw((alias) => {
                            console.log('RAW alias:', alias);
                            const positions = alias.split('.');
                            const aliasReplaced = positions.map((pos, index) => {
                                if (!pos.startsWith('"')) {
                                    return `"${pos}"`;
                                } else {
                                    return pos;
                                }
                            })
                            const aliasNew = aliasReplaced.join('.');
                            const val = value.replace('<alias>', aliasNew);
                            console.log('RAW value:', val);
                            return val;
                        });
                    default:
                        throw new Error(`Unknown operator: ${operator}`);
                }
            },
        }
    }

    async getTaskState(taskId: string) {
    }


}
