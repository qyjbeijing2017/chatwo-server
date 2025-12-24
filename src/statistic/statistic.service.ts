import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatwoLog } from 'src/entities/log.entity';
import { And, Any, ArrayContainedBy, ArrayContains, Between, DataSource, FindOptionsWhere, ILike, In, IsNull, LessThan, LessThanOrEqual, Like, MoreThan, MoreThanOrEqual, Not, Raw, Repository } from 'typeorm';
import { FlyDto } from './dto/fly.dto';
import { KilledDto } from './dto/pve.dto';
import { configManager } from 'src/configV2/config';
import { ChatwoUser } from 'src/entities/user.entity';
import { LogDto } from './dto/log.dto';
import { autoPatch } from 'src/utils/autoPatch';
import { ChatwoItem } from 'src/entities/item.entity';
import { ChatwoContainer } from 'src/entities/container.entity';

@Injectable()
export class StatisticService {
    constructor(
        @InjectRepository(ChatwoLog)
        private readonly logRepository: Repository<ChatwoLog>,
        @InjectRepository(ChatwoUser)
        private readonly userRepository: Repository<ChatwoUser>,
        @InjectRepository(ChatwoItem)
        private readonly itemRepository: Repository<ChatwoItem>,
        @InjectRepository(ChatwoContainer)
        private readonly containerRepository: Repository<ChatwoContainer>,
        private readonly dataSource: DataSource,
    ) { }

    async query(context, from, select, where, join, orderBy, limit, offset) {
        const take = Math.min(Number(limit) || 100, 100);
        const skip = Number(offset) || 0;
        switch (from) {
            case 'log':
                const logWhere: FindOptionsWhere<ChatwoLog> | FindOptionsWhere<ChatwoLog>[] = where ?? {};
                if (Array.isArray(logWhere)) {
                    for (const condition of logWhere) {
                        condition.tags = condition.tags ? And(ArrayContains([context.account.custom_id]), condition.tags as any) : ArrayContains([context.account.custom_id]);
                    }
                } else {
                    logWhere.tags = logWhere.tags ? And(ArrayContains([context.account.custom_id]), logWhere.tags as any) : ArrayContains([context.account.custom_id]);
                }
                return this.logRepository.findAndCount({
                    select: select,
                    where: logWhere,
                    order: orderBy,
                    skip,
                    take,
                    relations: join,
                });
            case 'user':
                const userWhere: FindOptionsWhere<ChatwoUser> | FindOptionsWhere<ChatwoUser>[] = where ?? {};
                if (Array.isArray(userWhere)) {
                    for (const condition of userWhere) {
                        condition.nakamaId = context.account.custom_id;
                    }
                } else {
                    userWhere.nakamaId = context.account.custom_id;
                }
                return this.userRepository.findAndCount({
                    select: select,
                    where: userWhere,
                    order: orderBy,
                    skip,
                    take,
                    relations: join,
                });
            case 'item':
                const itemWhere: FindOptionsWhere<ChatwoItem> | FindOptionsWhere<ChatwoItem>[] = where ?? {};
                if (Array.isArray(itemWhere)) {
                    for (const condition of itemWhere) {
                        condition.owner = condition.owner ?? {};
                        (condition.owner as ChatwoUser).nakamaId = context.account.custom_id;
                    }
                } else {
                    itemWhere.owner = itemWhere.owner ?? {};
                    (itemWhere.owner as ChatwoUser).nakamaId = context.account.custom_id;
                }
                return this.itemRepository.findAndCount({
                    select: select,
                    where: itemWhere,
                    order: orderBy,
                    skip,
                    take,
                    relations: join,
                });
            case 'container':
                const containerWhere: FindOptionsWhere<ChatwoContainer> | FindOptionsWhere<ChatwoContainer>[] = where  ?? {};
                if (Array.isArray(containerWhere)) {
                    for (const condition of containerWhere) {
                        condition.owner = condition.owner ?? {};
                        (condition.owner as ChatwoUser).nakamaId = context.account.custom_id;
                    }
                } else {
                    containerWhere.owner = containerWhere.owner ?? {};
                    (containerWhere.owner as ChatwoUser).nakamaId = context.account.custom_id;
                }
                return this.containerRepository.findAndCount({
                    select: select,
                    where: containerWhere,
                    order: orderBy,
                    skip,
                    take,
                    relations: join,
                });
            default:
                throw new Error(`Unknown from type: ${from}`);
        }
    }

    queryWhere(context, operator, value) {
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
                    return val;
                });
            default:
                throw new Error(`Unknown operator: ${operator}`);
        }
    }


    async getAllStatistics(logDto: LogDto, account?: ApiAccount) {
        const [result, total] = await this.logRepository.findAndCount({
            skip: logDto.skip || 0,
            take: 100,
            order: { createdAt: 'DESC' },
            where: {
                tags: account ? ArrayContains([...(logDto.tags || []), account.custom_id || '']) : ArrayContains(logDto.tags || []),
                createdAt: MoreThanOrEqual(new Date(logDto.afterThan || 0)),
            }
        });
        return {
            result,
            total,
        }
    }

    async dsl() {
        this.logRepository.findOne({
            select: {
                id: true,
            },
            where: {

            }
        });
        return {};
    }

    async flyIn(account: ApiAccount) {

    }

    async fly(account: ApiAccount, dto: FlyDto) {
        return autoPatch(this.dataSource, async (manager) => {
            const user = await manager.findOne(ChatwoUser, {
                where: {
                    nakamaId: account.custom_id,
                }
            });
            if (!user) {
                throw new NotFoundException(`User with nakamaId ${account.custom_id} not found`);
            }
            user.flyMeters += dto.meters;
            await manager.save(user);
            return {
                result: user,
                message: `User ${account.user?.username} flew ${dto.meters} meters.`,
                tags: [account.custom_id!, 'fly'],
            }
        });
    }

    async pve(account: ApiAccount, dto: KilledDto) {
        const monster = configManager.monsterMap.get(dto.whoWasKilled);
        if (!monster) {
            throw new NotFoundException(`Monster with id ${dto.whoWasKilled} not found`);
        }
        const log = this.logRepository.create({
            message: `User ${account.user?.username} killed ${dto.whoWasKilled}.`,
            tags: [account.custom_id || '', 'pve', dto.whoWasKilled, monster.Type],
        });
        await this.logRepository.save(log);
        return log;
    }

    async pvp(account: ApiAccount, dto: KilledDto) {
        const user = this.userRepository.findOneBy({ name: dto.whoWasKilled });
        if (!user) {
            throw new NotFoundException(`User with name ${dto.whoWasKilled} not found`);
        }
        const log = this.logRepository.create({
            message: `User ${account.user?.username} killed player ${dto.whoWasKilled}.`,
            tags: [account.custom_id || '', 'pvp', dto.whoWasKilled],
        });
        await this.logRepository.save(log);
        return log;
    }

    async dslQuery(account: ApiAccount, query: string) {
        try {
            const { exec, parserToCST, parseToAST } = await import(`../dsl`);
            const cst = parserToCST(query);
            const ast = parseToAST(cst);
            const result = await exec(ast, {
                query: this.query.bind(this),
                queryWhere: this.queryWhere.bind(this),
                account: account,
            });
            return {
                result,
            }
        } catch (error) {
            throw new BadRequestException(`DSL Query Error: ${error.message}`);
        }
    }
}
