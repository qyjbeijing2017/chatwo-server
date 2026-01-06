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
import { ChatwoItem, ItemType, keyToItemType } from 'src/entities/item.entity';
import { ChatwoContainer } from 'src/entities/container.entity';
import { NakamaService } from 'src/nakama/nakama.service';
import { getMetadata } from 'src/utils/meta-data';
import { Item } from 'src/configV2/tables/Items';

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
        private readonly nakamaService: NakamaService,
    ) { }

    async query(context, from, select, where, join, orderBy, limit, offset) {
        const take = Math.min(Number(limit) || 100, 100);
        const skip = Number(offset) || 0;
        switch (from) {
            case 'log':
                const logWhere: FindOptionsWhere<ChatwoLog> | FindOptionsWhere<ChatwoLog>[] = where ?? {};
                if (context.account) {
                    if (Array.isArray(logWhere)) {
                        for (const condition of logWhere) {
                            condition.tags = condition.tags ? And(ArrayContains([context.account.custom_id]), condition.tags as any) : ArrayContains([context.account.custom_id]);
                        }
                    } else {
                        logWhere.tags = logWhere.tags ? And(ArrayContains([context.account.custom_id]), logWhere.tags as any) : ArrayContains([context.account.custom_id]);
                    }
                }
                const [logResult, logCount] = await this.logRepository.findAndCount({
                    select: select,
                    where: logWhere,
                    order: orderBy,
                    skip,
                    take,
                    relations: join,
                });
                return {
                    results: logResult,
                    total: logCount,
                }
            case 'user':
                const userWhere: FindOptionsWhere<ChatwoUser> | FindOptionsWhere<ChatwoUser>[] = where ?? {};
                if (context.account) {
                    if (Array.isArray(userWhere)) {
                        for (const condition of userWhere) {
                            condition.nakamaId = context.account.custom_id;
                        }
                    } else {
                        userWhere.nakamaId = context.account.custom_id;
                    }
                }
                const [userResult, userCount] = await this.userRepository.findAndCount({
                    select: select,
                    where: userWhere,
                    order: orderBy,
                    skip,
                    take,
                    relations: join,
                });
                for (const user of userResult) {
                    (user as any).friends = await this.nakamaService.login(user.nakamaId).then(session => this.nakamaService.friendsList(session));
                }
                return {
                    results: userResult,
                    total: userCount,
                };
            case 'item':
                const itemWhere: FindOptionsWhere<ChatwoItem> | FindOptionsWhere<ChatwoItem>[] = where ?? {};
                if (context.account) {
                    if (Array.isArray(itemWhere)) {
                        for (const condition of itemWhere) {
                            condition.owner = condition.owner ?? {};
                            (condition.owner as ChatwoUser).nakamaId = context.account.custom_id;
                        }
                    } else {
                        itemWhere.owner = itemWhere.owner ?? {};
                        (itemWhere.owner as ChatwoUser).nakamaId = context.account.custom_id;
                    }
                }
                const [itemResult, itemCount] = await this.itemRepository.findAndCount({
                    select: select,
                    where: itemWhere,
                    order: orderBy,
                    skip,
                    take,
                    relations: join,
                });
                return {
                    results: itemResult,
                    total: itemCount,
                };
            case 'container':
                const containerWhere: FindOptionsWhere<ChatwoContainer> | FindOptionsWhere<ChatwoContainer>[] = where ?? {};
                if (context.account) {
                    if (Array.isArray(containerWhere)) {
                        for (const condition of containerWhere) {
                            condition.owner = condition.owner ?? {};
                            (condition.owner as ChatwoUser).nakamaId = context.account.custom_id;
                        }
                    } else {
                        containerWhere.owner = containerWhere.owner ?? {};
                        (containerWhere.owner as ChatwoUser).nakamaId = context.account.custom_id;
                    }
                }
                const [containerResult, containerCount] = await this.containerRepository.findAndCount({
                    select: select,
                    where: containerWhere,
                    order: orderBy,
                    skip,
                    take,
                    relations: join,
                });
                return {
                    results: containerResult,
                    total: containerCount,
                };
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

    getAllItemKeysFromType(type: string): string[] {
        const transformer = getMetadata('configTable:transformer', Item, 'type') as (val: string) => ItemType;
        const itemType = transformer(type);
        const keys: string[] = [];
        for (const item of configManager.items) {
            if (item.type === itemType) {
                keys.push(item.key);
            }
        }
        return keys;
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

    date(value: string | number | Date) {
        return new Date(value);
    }

    KeysFromItemType(type: string) {
        const itemType = keyToItemType(type);
        return Array.from(configManager.itemMap.values()).filter(item => (item.type & itemType) !== 0).map(item => item.key);
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
            const result = await this.execDsl(query, account);
            return {
                result,
            }
        } catch (error) {
            throw new BadRequestException(`DSL Query Error: ${error.message}`);
        }
    }

    createContext(account: ApiAccount | null, other: { [key: string]: any } = {}) {
        return {
            query: this.query.bind(this),
            queryWhere: this.queryWhere.bind(this),
            getAllItemKeysFromType: this.getAllItemKeysFromType.bind(this),
            date: this.date.bind(this),
            KeysFromItemType: this.KeysFromItemType.bind(this),
            account,
            ...other,
        };
    }

    async execDsl(dsl: string, account: ApiAccount | null = null, extraContext: { [key: string]: any } = {}) {
        const context = this.createContext(account, extraContext);
        const { exec, parserToCST, parseToAST } = await import(`../dsl`);
        const cst = parserToCST(dsl);
        const ast = parseToAST(cst);
        return exec(ast, context);
    }

    async completeTutorial(account: ApiAccount) {
        return autoPatch(this.dataSource, async (manager) => {
            const user = await manager.findOne(ChatwoUser, {
                where: {
                    nakamaId: account.custom_id,
                }
            });
            if (!user) {
                throw new NotFoundException(`User with nakamaId ${account.custom_id} not found`);
            }
            user.tutorialCompleted = true;
            await manager.save(user);
            return {
                result: user,
                message: `User ${account.user?.username} completed the tutorial.`,
                tags: [account.custom_id!, 'tutorial'],
            }
        });
    }

    async breakBlade(account: ApiAccount) {
        const user = await this.userRepository.findOne({
            where: {
                nakamaId: account.custom_id,
            }
        });
        if (!user) {
            throw new NotFoundException(`User with nakamaId ${account.custom_id} not found`);
        }
        user.breakBladeTimes += 1;
        return await this.userRepository.save(user);
    }
}
