import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { configManager } from 'src/configV2/config';
import { ArchievementTaskCategory, ArchievementTaskType, SubmitItemsInfo } from 'src/configV2/tables/archievementTask';
import { ChatwoLog } from 'src/entities/log.entity';
import { ChatwoTask, TaskStatus } from 'src/entities/task.entity';
import { ChatwoUser } from 'src/entities/user.entity';
import { SignInEvent } from 'src/event/sign-in.event';
import { ItemService } from 'src/item/item.service';
import { StatisticService } from 'src/statistic/statistic.service';
import { autoPatch } from 'src/utils/autoPatch';
import { getServerTime } from 'src/utils/serverTime';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { SubmitItemDto } from './submit-Item.dto';
import { ChatwoItem, ItemType } from 'src/entities/item.entity';
import { UserEvent } from 'src/event/user.event';
import { findOneAsync } from 'src/utils/arrayAsync';
import { SubmitArmEvent } from 'src/event/submit-arm.event';

@Injectable()
export class TaskService {
    private readonly logger = new Logger(TaskService.name);
    constructor(
        private readonly statisticService: StatisticService,
        @InjectRepository(ChatwoLog)
        private readonly logRepository: Repository<ChatwoLog>,
        @InjectRepository(ChatwoTask)
        private readonly taskRepository: Repository<ChatwoTask>,
        @InjectRepository(ChatwoUser)
        private readonly userRepository: Repository<ChatwoUser>,
        private readonly dataSource: DataSource,
        private readonly itemService: ItemService,
        private readonly eventEmitter: EventEmitter2,

    ) {
    }

    async getTasks(account: ApiAccount) {
        await this.handleTaskRefreshOnSignInEvent({ account } as SignInEvent);
        return await this.taskRepository.find({
            where: {
                owner: {
                    nakamaId: account.custom_id,
                },
                isExpired: false,
            },
        });
    }

    async claimTaskReward(account: ApiAccount, taskId: string) {
        return autoPatch(this.dataSource, async (manager: EntityManager) => {
            const tags = ['task', 'claimTaskReward']
            const task = await manager.findOne(ChatwoTask, {
                where: {
                    key: taskId,
                    owner: {
                        nakamaId: account.custom_id,
                    },
                    isExpired: false,
                    status: TaskStatus.IN_PROGRESS,
                },
            });
            if (!task) {
                throw new NotFoundException('Task not found');
            }
            const taskConfig = configManager.archievementTaskMap.get(task.key);
            if (!taskConfig) {
                this.logger.error(`Task config not found for task key ${task.key} when claiming task reward for task id ${taskId} and account ${account.custom_id}`);
                throw new NotFoundException('Task config not found');
            }

            for (let i = 0; i < taskConfig.Submit.length; i++) {
                const submitInfo = taskConfig.Submit[i];
                if (submitInfo.total > task.progress[i]) {
                    throw new BadRequestException('Task not completed yet');
                }
            }

            await this.itemService.gainItems(manager, account, taskConfig.Award, true);
            task.status = TaskStatus.DONE;
            await manager.save(task);
            return {
                tags,
                result: task,
                message: `Claimed reward for task ${taskId}`,
            }
        })
    }

    async submitItem(account: ApiAccount, taskId: string, submitItemDto: SubmitItemDto | ChatwoItem) {
        return autoPatch(this.dataSource, async (manager: EntityManager) => {
            const tags = ['task', 'submitItem']
            const task = await manager.findOne(ChatwoTask, {
                where: {
                    key: taskId,
                    owner: {
                        nakamaId: account.custom_id,
                    },
                    isExpired: false,
                    status: TaskStatus.IN_PROGRESS,
                },
            });
            if (!task) {
                throw new NotFoundException('Task not found');
            };
            const taskConfig = configManager.archievementTaskMap.get(task.key);
            if (!taskConfig) {
                this.logger.error(`Task config not found for task key ${task.key} when submitting item for task id ${taskId} and account ${account.custom_id}`);
                throw new NotFoundException('Task config not found');
            }
            let requiredItem: SubmitItemsInfo | null = null;
            let submitInfoIndex = -1;
            try {
                requiredItem = await findOneAsync(taskConfig.Submit, async (submitInfo, index) => {
                    submitInfoIndex = index;
                    return this.statisticService.execDsl(submitInfo.check, account, {
                        ...submitItemDto,
                    });
                });
            } catch (e) {
                this.logger.error(`Error parsing task submit requirement for task id ${taskId} and account ${account.custom_id}: ${e}`);
                throw e;
            }
            if (!requiredItem) {
                throw new BadRequestException('Item not required for this task');
            }
            if (requiredItem.total <= task.progress[submitInfoIndex]) {
                throw new BadRequestException('Task already completed for this item');
            }
            const itemConfig = configManager.itemMap.get(submitItemDto.key);
            if (!itemConfig) {
                this.logger.error(`Item config not found for item key ${submitItemDto.key} when submitting item for task id ${taskId} and account ${account.custom_id}`);
                throw new NotFoundException('Item config not found');
            }
            if (itemConfig.type & ItemType.lock) {
                throw new BadRequestException('Locked item cannot be submitted for task');
            }
            if (itemConfig.type & ItemType.ownable) {
                let item = await manager.findOne(ChatwoItem, {
                    where: {
                        owner: {
                            nakamaId: account.custom_id,
                        },
                        key: submitItemDto.key,
                        nakamaId: account.custom_id,
                    },
                })
                if (!item) {
                    throw new NotFoundException('Item not found, or it is not your item.');
                }
                await manager.delete(ChatwoItem, item);
                submitItemDto = item;
            }
            tags.push(submitItemDto.key);
            task.progress[submitInfoIndex] = (task.progress[submitInfoIndex] || 0) + 1;
            await manager.save(task);
            if (itemConfig.type & ItemType.arm) {
                this.eventEmitter.emit('user.submit-arm', new SubmitArmEvent(account, submitItemDto as ChatwoItem));
            }
            return {
                tags,
                result: task,
                message: `Submitted item ${submitItemDto.key} for task ${taskId}`,
            }

        })
    }

    @OnEvent('user.sign-in')
    async handleTaskRefreshOnSignInEvent(payload: SignInEvent) {
        const user = await this.userRepository.findOne({
            where: {
                nakamaId: payload.account.custom_id,
            },
        });

        if (!user) {
            this.logger.error(`User with nakamaId ${payload.account.custom_id} not found when handling sign-in event for task refresh`);
            return;
        }

        const tasks = await this.taskRepository.find({
            where: {
                owner: {
                    nakamaId: payload.account.custom_id,
                },
                isExpired: false,
            },
        });
        let dailycraftingTasks: ChatwoTask | null = null; // 3
        let dailyCombatTasks: ChatwoTask | null = null; // 1
        let dailySocialTasks: ChatwoTask | null = null; // 2
        const weeklyTasks: {
            [key: string]: ChatwoTask
        } = {}; // can be multiple, but not guaranteed to have all of them

        // task delete if expired
        for (const task of tasks) {
            const taskConfig = configManager.archievementTaskMap.get(task.key);
            if (!taskConfig) {
                this.logger.error(`Task config not found for task key ${task.key} when handling sign-in event for task refresh`);
                continue;
            }
            if (taskConfig.Type === ArchievementTaskType.daily) {
                const time = getServerTime().startOf('day');
                if (task.createdAt < time.toDate()) {
                    task.isExpired = true;
                    await this.taskRepository.save(task);
                    continue;
                }
                if (taskConfig.Category === ArchievementTaskCategory.crafting) {
                    dailycraftingTasks = task;
                } else if (taskConfig.Category === ArchievementTaskCategory.combat) {
                    dailyCombatTasks = task;
                } else if (taskConfig.Category === ArchievementTaskCategory.social) {
                    dailySocialTasks = task;
                }
            } else if (taskConfig.Type === ArchievementTaskType.weekly) {
                const time = getServerTime().startOf('week');
                if (task.createdAt < time.toDate()) {
                    task.isExpired = true;
                    await this.taskRepository.save(task);
                    continue;
                }
                weeklyTasks[task.key] = task;
            } else {
                await this.taskRepository.remove(task);
            }
        }

        // task create if not exist
        if (!dailycraftingTasks) {
            const craftingTaskConfig = configManager.archievementTask.filter(t => t.Category === ArchievementTaskCategory.crafting && t.Type === ArchievementTaskType.daily);
            if (craftingTaskConfig.length <= 0) {
                this.logger.error(`No crafting daily task config found when handling sign-in event for task refresh`);
            } else {
                const config = craftingTaskConfig[Math.floor(Math.random() * craftingTaskConfig.length)];
                const craftingTask = this.taskRepository.create({
                    key: config.Name,
                    owner: user,
                });
                await this.taskRepository.save(craftingTask);
            }
        }
        if (!dailyCombatTasks) {
            const combatTaskConfig = configManager.archievementTask.filter(t => t.Category === ArchievementTaskCategory.combat && t.Type === ArchievementTaskType.daily);
            if (combatTaskConfig.length <= 0) {
                this.logger.error(`No combat daily task config found when handling sign-in event for task refresh`);
            } else {
                const config = combatTaskConfig[Math.floor(Math.random() * combatTaskConfig.length)];
                const combatTask = this.taskRepository.create({
                    key: config.Name,
                    owner: user,
                });
                await this.taskRepository.save(combatTask);
            }
        }
        if (!dailySocialTasks) {
            const socialTaskConfig = configManager.archievementTask.filter(t => t.Category === ArchievementTaskCategory.social && t.Type === ArchievementTaskType.daily);
            if (socialTaskConfig.length <= 0) {
                this.logger.error(`No social daily task config found when handling sign-in event for task refresh`);
            } else {
                const config = socialTaskConfig[Math.floor(Math.random() * socialTaskConfig.length)];
                const socialTask = this.taskRepository.create({
                    key: config.Name,
                    owner: user,
                });
                await this.taskRepository.save(socialTask);
            }
        }

        // weekly task create if not exist, no random here, just create all if not exist, since we don't have that many weekly tasks and it's not a problem to have them all
        const weeklyTaskConfig = configManager.archievementTask.filter(t => t.Type === ArchievementTaskType.weekly);
        for (const config of weeklyTaskConfig) {
            if (!weeklyTasks[config.Name]) {
                const weeklyTask = this.taskRepository.create({
                    key: config.Name,
                    owner: user,
                });
                await this.taskRepository.save(weeklyTask);
            }
        }

    }

    @OnEvent('user.*')
    async handleUserEvent(payload: UserEvent) {
        const user = await this.userRepository.findOne({
            where: {
                nakamaId: payload.account.custom_id,
            },
        });
        if (!user) {
            this.logger.error(`User with nakamaId ${payload.account.custom_id} not found when handling user event ${payload.eventId} for task progress update`);
            return;
        }
        const tasks = await this.taskRepository.find({
            where: {
                owner: {
                    nakamaId: payload.account.custom_id,
                },
                isExpired: false,
                status: TaskStatus.IN_PROGRESS,
            },
        });
        for (const task of tasks) {
            const taskConfig = configManager.archievementTaskMap.get(task.key);
            if (!taskConfig) {
                this.logger.error(`Task config not found for task key ${task.key} when handling user event ${payload.eventId} for task progress update`);
                continue;
            }
            const requirement = taskConfig.Submit;
            for (const key in requirement) {
                const submitInfo = requirement[key];
                if (typeof submitInfo === 'object' && submitInfo.events) {
                    for (const eventKey in submitInfo.events) {
                        if (eventKey === payload.eventId) {
                            try {
                                const value = await this.statisticService.execDsl(submitInfo.events[eventKey].toString(), payload.account, {
                                    teleportDifferent: async (name: string) => {
                                        if (task.extra[name]) {
                                            return false;
                                        }
                                        task.extra = {
                                            ...task.extra,
                                            [name]: true,
                                        };
                                        return true;
                                    },
                                    ...payload,
                                }) as boolean | number;
                                const valueNumber = typeof value === 'boolean' ? (value ? 1 : 0) : value;
                                if (valueNumber !== 0) {
                                    task.progress[key] = (task.progress[key] || 0) + valueNumber;
                                    await this.taskRepository.save(task);
                                }
                            } catch (e) {
                                this.logger.error(`Error executing DSL for task progress update for task ${task.key} and event ${payload.eventId} for account ${payload.account.custom_id}: ${e}`);
                                continue;
                            }
                        }
                    }
                }
            }
        }
    }
}