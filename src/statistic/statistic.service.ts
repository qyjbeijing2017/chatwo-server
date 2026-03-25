import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
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
import { getServerTime, todayStart } from 'src/utils/serverTime';
import { ChatwoBug } from 'src/entities/bug.entity';
import { ChatwoTask } from 'src/entities/task.entity';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { FlyEvent } from 'src/event/fly.event';
import { MonsterKilledEvent } from 'src/event/monster-killed.event';
import { DuelEvent } from 'src/event/duel.evemt';
import { TeleportEvent } from 'src/event/teleport.event';
import { AddFriendEvent } from 'src/event/add-friend.event';
import { OnlineDto } from './dto/online.dto';
import { UserEvent } from 'src/event/user.event';
import { ChatwoStatistic } from 'src/entities/statistic.entity';
import { StatisticRefreshType } from 'src/configV2/tables/statistic';

const WHITE_PATH_MAP: Record<string, string> = {
    exp: 'exp',
    bladeKey: 'bladeKey',
    isOn: 'isOn',
    energy: 'energy',
};

function whitePath(key: string) {
    if (!WHITE_PATH_MAP[key]) {
        throw new BadRequestException('invalid path');
    }
    return WHITE_PATH_MAP[key];
}

export interface DslOptions {
    openBug?: boolean;
}

@Injectable()
export class StatisticService {
    private readonly logger = new Logger(StatisticService.name);
    constructor(
        @InjectRepository(ChatwoLog)
        private readonly logRepository: Repository<ChatwoLog>,
        @InjectRepository(ChatwoUser)
        private readonly userRepository: Repository<ChatwoUser>,
        @InjectRepository(ChatwoItem)
        private readonly itemRepository: Repository<ChatwoItem>,
        @InjectRepository(ChatwoContainer)
        private readonly containerRepository: Repository<ChatwoContainer>,
        @InjectRepository(ChatwoBug)
        private readonly bugRepository: Repository<ChatwoBug>,
        @InjectRepository(ChatwoTask)
        private readonly taskRepository: Repository<ChatwoTask>,
        @InjectRepository(ChatwoStatistic)
        private readonly statisticRepository: Repository<ChatwoStatistic>,
        private readonly dataSource: DataSource,
        private readonly nakamaService: NakamaService,
        private readonly eventEmitter: EventEmitter2,
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
                // for (const user of userResult) {
                //     (user as any).friends = await this.nakamaService.login(user.nakamaId).then(session => this.nakamaService.friendsList(session));
                // }
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
            case 'task':
                const taskWhere: FindOptionsWhere<ChatwoTask> | FindOptionsWhere<ChatwoTask>[] = where ?? {};
                if (context.account) {
                    if (Array.isArray(taskWhere)) {
                        for (const condition of taskWhere) {
                            condition.owner = condition.owner ?? {};
                            (condition.owner as ChatwoUser).nakamaId = context.account.custom_id;
                        }
                    } else {
                        taskWhere.owner = taskWhere.owner ?? {};
                        (taskWhere.owner as ChatwoUser).nakamaId = context.account.custom_id;
                    }
                }
                const [taskResult, taskCount] = await this.taskRepository.findAndCount({
                    select: select,
                    where: taskWhere,
                    order: orderBy,
                    skip,
                    take,
                    relations: join,
                });
                return {
                    results: taskResult,
                    total: taskCount,
                };
            case 'statistic':
                const statisticWhere: FindOptionsWhere<ChatwoStatistic> | FindOptionsWhere<ChatwoStatistic>[] = where ?? {};
                if (context.account) {
                    if (Array.isArray(statisticWhere)) {
                        for (const condition of statisticWhere) {
                            condition.owner = condition.owner ?? {};
                            (condition.owner as ChatwoUser).nakamaId = context.account.custom_id;
                        }
                    } else {
                        statisticWhere.owner = statisticWhere.owner ?? {};
                        (statisticWhere.owner as ChatwoUser).nakamaId = context.account.custom_id;
                    }
                }
                const [statisticResult, statisticCount] = await this.statisticRepository.findAndCount({
                    select: select,
                    where: statisticWhere,
                    order: orderBy,
                    skip,
                    take,
                    relations: join,
                });
                return {
                    results: statisticResult,
                    total: statisticCount,
                };
            case 'bug':
                if (context.options?.openBug) {
                    const bugWhere: FindOptionsWhere<ChatwoBug> | FindOptionsWhere<ChatwoBug>[] = where ?? {};
                    const [containerResult, containerCount] = await this.bugRepository.findAndCount({
                        select: select,
                        where: bugWhere,
                        order: orderBy,
                        skip,
                        take,
                        relations: join,
                    });
                    return {
                        results: containerResult,
                        total: containerCount,
                    };
                } else {
                    throw new Error('Table bug is not open for query');
                }

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
            // case "RAW":
            //     return Raw((alias) => {
            //         const positions = alias.split('.');
            //         const aliasReplaced = positions.map((pos, index) => {
            //             if (!pos.startsWith('"')) {
            //                 return `"${pos}"`;
            //             } else {
            //                 return pos;
            //             }
            //         })
            //         const aliasNew = aliasReplaced.join('.');
            //         const val = value.replace('<alias>', aliasNew);
            //         return val;
            //     });
            case "&&":
                return Raw((alias) => `${alias} && :value`, { value });
            case "@>&&":
                return And(ArrayContains(value[0]), Raw((alias) => `${alias} && :value`, { value: value[1] }));
            case "JSONB":
                let transformTo = '';
                switch (value[0]) {
                    case 'number':
                        transformTo = '::float8';
                        break;
                    case 'boolean':
                        transformTo = '::bool';
                        break;
                }
                let keys = whitePath(value[1]);
                let sign = '=';
                switch (value[2]) {
                    case '!=':
                        sign = '!=';
                        break;
                    case '>':
                        sign = '>';
                        break;
                    case '<':
                        sign = '<';
                    case '>=':
                        sign = '>=';
                        break;
                    case '<=':
                        sign = '<=';
                        break;
                    case 'IS NULL':
                        sign = 'IS NULL';
                        break;
                    case 'IS NOT NULL':
                        sign = 'IS NOT NULL';
                        break;
                    case 'IN':
                        sign = 'IN';
                        break;
                }
                if (sign === 'IS NULL' || sign === 'IS NOT NULL') {
                    return Raw((alias) => `(${alias} #>> '{${keys}}') ${sign}`);
                }
                if (sign === 'IN') {
                    return Raw((alias) => `(${alias} #>> '{${keys}}') ${sign} (:...val)`, { val: value[3] ?? [] });
                }
                return Raw((alias) => `(${alias} #>> '{${keys}}')${transformTo} ${sign} :val`, { val: value[3] ?? '' });
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

    async friendList(account: ApiAccount) {
        const session = await this.nakamaService.login(account.custom_id || '');
        return this.nakamaService.friendsList(session);
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

    async todayFlyMeters(account: ApiAccount) {
        const user = await this.userRepository.findOne({
            where: {
                nakamaId: account.custom_id,
            }
        });
        if (!user) {
            throw new NotFoundException(`User with nakamaId ${account.custom_id} not found`);
        }
        const today = todayStart();
        if (!user.lastFlyMeterUpdate || user.lastFlyMeterUpdate < today) {
            return 0;
        }
        return user.todayFlyMeters;
    }

    async fly(account: ApiAccount, dto: FlyDto) {
        this.eventEmitter.emit('user.fly', new FlyEvent(account, dto.meters));
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
            const today = todayStart();
            if (!user.lastFlyMeterUpdate || user.lastFlyMeterUpdate < today) {
                user.todayFlyMeters = dto.meters;
            } else {
                user.todayFlyMeters += dto.meters;
            }
            user.lastFlyMeterUpdate = new Date();
            await manager.save(user);
            return {
                result: user,
                message: `User ${account.user?.username} flew ${dto.meters} meters.`,
                tags: [account.custom_id!, 'fly'],
            }
        });
    }

    async pve(account: ApiAccount, dto: KilledDto) {
        this.eventEmitter.emit('user.monster-killed', new MonsterKilledEvent(account, dto.whoWasKilled));
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
        this.eventEmitter.emit('user.duel', new DuelEvent(account, dto.whoWasKilled));
        const user = await this.userRepository.findOneBy({ name: dto.whoWasKilled });
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

    async online(account: ApiAccount, dto: OnlineDto) {
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

    toSqlStringArray(array: string[]) {
        return `ARRAY[${array.map(item => `'${item}'`).join(', ')}]`;
    }

    createContext(account: ApiAccount | null, other: { [key: string]: any } = {}, options: DslOptions) {
        return {
            query: this.query.bind(this),
            queryWhere: this.queryWhere.bind(this),
            getAllItemKeysFromType: this.getAllItemKeysFromType.bind(this),
            date: this.date.bind(this),
            KeysFromItemType: this.KeysFromItemType.bind(this),
            friendList: this.friendList.bind(this),
            toSqlStringArray: this.toSqlStringArray.bind(this),
            getServerTime,
            todayStart,
            todayFlyMeters: this.todayFlyMeters.bind(this),
            getMonsterConfigByKey: (key: string) => configManager.monsterMap.get(key),
            getItemConfigByKey: (key: string) => configManager.itemMap.get(key),
            branch: (condition: boolean, trueVal: any, falseVal: any) => condition ? trueVal : falseVal,
            account,
            ...other,
            options,
        };
    }

    async execDsl(dsl: string, account: ApiAccount | null = null, extraContext: { [key: string]: any } = {}, options: DslOptions = {}) {
        const context = this.createContext(account, extraContext, options);
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

    async teleport(account: ApiAccount, name: string) {
        this.eventEmitter.emit('user.teleport', new TeleportEvent(account, name));
    }

    async addNewFriend(account: ApiAccount, friendName: string) {
        this.eventEmitter.emit('user.add-friend', new AddFriendEvent(account, friendName));
    }

    @OnEvent('user.*')
    async handleUserEvent(payload: UserEvent) {
        const user = await this.userRepository.findOne({
            where: {
                nakamaId: payload.account.custom_id,
            },
        });
        if (!user) {
            this.logger.error(`User with nakamaId ${payload.account.custom_id} not found`);
            return;
        }

        const configs = configManager.statistic.filter(config => payload.eventId in config.Rule);
        for (const config of configs) {
            let [statistic] = await this.statisticRepository.find({
                where: {
                    name: config.name,
                    owner: user,
                },
                order: {
                    createdAt: 'DESC',
                },
                take: 1,
            });

            if (
                !statistic ||
                (config.RefreshType === StatisticRefreshType.yearly && statistic.createdAt < getServerTime().startOf('year').toDate()) ||
                (config.RefreshType === StatisticRefreshType.monthly && statistic.createdAt < getServerTime().startOf('month').toDate()) ||
                (config.RefreshType === StatisticRefreshType.weekly && statistic.createdAt < getServerTime().startOf('week').toDate()) ||
                (config.RefreshType === StatisticRefreshType.daily && statistic.createdAt < getServerTime().startOf('day').toDate())
            ) {
                statistic = this.statisticRepository.create({
                    name: config.name,
                    progress: 0,
                    owner: user,
                });
            }

            try {
                const value = await this.execDsl(config.Rule[payload.eventId], payload.account, {
                    ...payload,
                }) as boolean | number;
                statistic.progress += typeof value === 'boolean' ? (value ? 1 : 0) : value;
                await this.statisticRepository.save(statistic);
            } catch (e) {
                this.logger.error(`Failed to execute statistic DSL for statistic ${config.name} on event ${payload.eventId}: ${e.message}`);
                continue;
            }

        }
    }
}
