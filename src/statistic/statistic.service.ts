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
import { OnlineEvent } from 'src/event/online.event';
import { ChatwoReedem } from 'src/entities/reedem.entity';
import { ChatwoBill } from 'src/entities/bill.entity';
import { log } from 'console';

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
        @InjectRepository(ChatwoReedem)
        private readonly reedemRepository: Repository<ChatwoReedem>,
        @InjectRepository(ChatwoBill)
        private readonly billRepository: Repository<ChatwoBill>,
        private readonly dataSource: DataSource,
        private readonly nakamaService: NakamaService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    async query(context, from, select, where, join, orderBy, limit, offset) {
        const take = Math.min(Number(limit) || 100, 100);
        const skip = Number(offset) || 0;
        switch (from) {
            case 'reedem':
                const reedemWhere: FindOptionsWhere<ChatwoReedem> | FindOptionsWhere<ChatwoReedem>[] = where ?? {};
                if (context.account) {
                    if (Array.isArray(reedemWhere)) {
                        for (const condition of reedemWhere) {
                            condition.owner = condition.owner ?? {};
                            (condition.owner as ChatwoUser).nakamaId = context.account.custom_id;
                        }
                    } else {
                        reedemWhere.owner = reedemWhere.owner ?? {};
                        (reedemWhere.owner as ChatwoUser).nakamaId = context.account.custom_id;
                    }
                }
                const [reedemResult, reedemCount] = await this.reedemRepository.findAndCount({
                    select: select,
                    where: reedemWhere,
                    order: orderBy,
                    skip,
                    take,
                    relations: join,
                });
                return {
                    results: reedemResult,
                    total: reedemCount,
                };
            case 'bill':
                const billWhere: FindOptionsWhere<ChatwoBill> | FindOptionsWhere<ChatwoBill>[] = where ?? {};
                if (context.account) {
                    if (Array.isArray(billWhere)) {
                        for (const condition of billWhere) {
                            condition.owner = condition.owner ?? {};
                            (condition.owner as ChatwoUser).nakamaId = context.account.custom_id;
                        }
                    } else {
                        billWhere.owner = billWhere.owner ?? {};
                        (billWhere.owner as ChatwoUser).nakamaId = context.account.custom_id;
                    }
                }
                const [billResult, billCount] = await this.billRepository.findAndCount({
                    select: select,
                    where: billWhere,
                    order: orderBy,
                    skip,
                    take,
                    relations: join,
                });
                return {
                    results: billResult,
                    total: billCount,
                }
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
                tags: [account.custom_id!, 'fly', `meters:${dto.meters}`, account.user?.username || ''],
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
            tags: [account.custom_id || '', 'pve', dto.whoWasKilled, monster.Type, account.user?.username || ''],
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
            tags: [account.custom_id || '', 'pvp', dto.whoWasKilled, account.user?.username || ''],
        });
        await this.logRepository.save(log);
        return log;
    }

    async online(account: ApiAccount, dto: OnlineDto) {
        this.eventEmitter.emit('user.online', new OnlineEvent(account, dto.minutes));
        return {};
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
            crossOver: (before: number, after: number, threshold: number) => before < threshold && after >= threshold,
            min: (a: number, b: number) => Math.min(a, b),
            max: (a: number, b: number) => Math.max(a, b),
            floor: (a: number) => Math.floor(a),
            ceil: (a: number) => Math.ceil(a),
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

    async dslToExec(dsl: string, account: ApiAccount | null = null, options: DslOptions = {}) {
        const { exec, parserToCST, parseToAST } = await import(`../dsl`);
        const cst = parserToCST(dsl);
        const ast = parseToAST(cst);
        return (extraContext: { [key: string]: any } = {}) => {
            const context = this.createContext(account, extraContext, options);
            return exec(ast, context);
        }
    }

    async completeTutorial(account: ApiAccount) {
        return autoPatch(this.dataSource, async (manager) => {
            const user = await manager.findOne(ChatwoUser, {
                where: {
                    nakamaId: account.custom_id,
                }
            });
            if (!user) {
                throw new NotFoundException(`User with nakamaId ${account.custom_id}, name: ${account.user?.username || ''} not found`);
            }
            user.tutorialCompleted = true;
            await manager.save(user);
            return {
                result: user,
                message: `User ${account.user?.username} completed the tutorial.`,
                tags: [account.custom_id!, 'tutorial', account.user?.username || ''],
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
            throw new NotFoundException(`User with nakamaId ${account.custom_id}, name: ${account.user?.username || ''} not found`);
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
            this.logger.error(`User with nakamaId ${payload.account.custom_id}, name: ${payload.account.user?.username || ''} not found`);
            return;
        }

        const configs = configManager.statistic.filter(config => payload.eventId in config.Rule);
        for (const config of configs) {
            let [statistic] = await this.statisticRepository.find({
                where: {
                    name: config.name,
                    owner: { id: user.id },
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
                    name: config.Name,
                    progress: 0,
                    owner: user,
                });
            }

            try {
                const dsls: string[] = Array.isArray(config.Rule[payload.eventId]) ? config.Rule[payload.eventId] as string[] : [config.Rule[payload.eventId] as string];

                const statistics: Map<string, ChatwoStatistic> = new Map();
                const getStatistic = async (name: string) => {
                    if (statistics.has(name)) {
                        return statistics.get(name);
                    }
                    const stat = await this.statisticRepository.findOne({
                        where: {
                            name,
                            owner: { id: user.id },
                        },
                    });
                    if (stat) {
                        statistics.set(name, stat);
                    }
                    return stat
                }

                this.logger.log(`dsls ${JSON.stringify(log)}`);

                for (const dsl of dsls) {
                    this.logger.log(`dsl ${dsl}`)
                    const value = await this.execDsl(dsl.toString(), payload.account, {
                        configManager,
                        ...payload,
                        extra: statistic.extra,
                        before: statistic.progress,
                        getStatistic,
                        statisticEvery: async (name: string, value: number, everyValue: number) => {
                            const statistic = await getStatistic(name);
                            if (!statistic) {
                                return 0;
                            }
                            const times = Math.floor(statistic.progress / everyValue);
                            const newTimes = Math.floor((statistic.progress + value) / everyValue);
                            return newTimes - times;
                        },
                        statisticHit: async (name: string, value: number, hit: number) => {
                            const statistic = await getStatistic(name);
                            if (!statistic) {
                                return 0;
                            }
                            return statistic.progress < hit && statistic.progress + value >= hit ? 1 : 0;
                        },
                        setExtra: (key: string, value: any) => {
                            statistic.extra = {
                                ...statistic.extra,
                                [key]: value,
                            }
                        },
                        addExtra: (key: string, value: number) => {
                            statistic.extra = {
                                ...statistic.extra,
                                [key]: ((statistic.extra as any)[key] || 0) + value,
                            }
                        },
                        statisticExtra: async (name: string, key: any) => {
                            const statistic = await getStatistic(name);
                            if (!statistic) {
                                return 0;
                            }
                            return statistic.extra ? (statistic.extra as any)[key] : 0;
                        },
                        statisticExtrasMoreThanOne: async (name: string, keys: string[]) => {
                            if (keys.length === 0) {
                                return 0;
                            }
                            const statistic = await getStatistic(name);
                            if (!statistic) {
                                return 0;
                            }
                            return keys.every(key => statistic.extra && (statistic.extra as any)[key]) ? 1 : 0;
                        },
                        armSessionNames: (name: string) => {
                            return configManager.bladeAppearanceMap.get(name)?.map((appearance, index) => appearance.BladeKey + index) || [];
                        },
                        collectionSession: async (name: string, variantIndex: number) => {
                            const statistic = await getStatistic(name);
                            if (!statistic) {
                                return 0;
                            }
                            const collection = configManager.bladeAppearanceMap.get(statistic.name);
                            if (!collection) {
                                return 0;
                            }
                            const extra = statistic.extra || {};
                            for (let index = 0; index < collection.length; index++) {
                                const key = collection[index].BladeKey + index;
                                if (index === variantIndex) {
                                    if (extra[key] && extra[key] >= 1) {
                                        return 0;
                                    }
                                } else {
                                    if (!extra[key] || extra[key] < 1) {
                                        return 0;
                                    }
                                }
                            }
                            return 1;

                        },
                        collectionArms: async (name: string, keys: string[], newKey: string) => {
                            const statistic = await getStatistic(name);
                            if (!statistic) {
                                return 0;
                            }
                            const extra = statistic.extra || {};
                            for (const key of keys) {
                                if (key === newKey) {
                                    if (extra[key] && extra[key] >= 1) {
                                        return 0;
                                    }
                                } else {
                                    if (!extra[key] || extra[key] < 1) {
                                        return 0;
                                    }
                                }
                            }
                            return 1;

                        }
                    }) as boolean | number;
                    this.logger.log(`value ${value}`)
                    statistic.progress += typeof value === 'boolean' ? (value ? 1 : 0) : value;
                    this.logger.log(`progress ${statistic.progress}`);                    
                }
                this.logger.log(`statistic ${JSON.stringify(statistic)}`)
                await this.statisticRepository.save(statistic);
            } catch (e) {
                this.logger.error(`Failed to execute statistic DSL for statistic ${config.Name} on event ${payload.eventId}:  ${e.message}`);
                continue;
            }

        }
    }

    async getMyStatistic(account: ApiAccount, name: string) {
        const result = await this.statisticRepository.findOne({
            where: {
                name,
                owner: {
                    nakamaId: account.custom_id,
                }
            },
            order: {
                createdAt: 'DESC',
            }
        }) || this.statisticRepository.create({
            name,
            progress: 0,
        });
        return result;
    }

    async getStatistic(name: string, limit = 100, offset = 0) {
        return this.statisticRepository.find({
            where: {
                name,
            },
            order: {
                progress: 'DESC',
            },
            take: limit,
            skip: offset,
        });
    }
}
