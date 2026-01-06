import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { configManager } from 'src/configV2/config';
import { ArchievementTaskConfig, ArchievementTaskType } from 'src/configV2/tables/archievementTask';
import { ChatwoLog } from 'src/entities/log.entity';
import { ItemService } from 'src/item/item.service';
import { StatisticService } from 'src/statistic/statistic.service';
import { autoPatch } from 'src/utils/autoPatch';
import { todayStart } from 'src/utils/serverTime';
import { ArrayContains, DataSource, EntityManager, MoreThan, MoreThanOrEqual, Repository } from 'typeorm';

export enum TaskStatus {
    notComplete = 'notComplete',
    couldComplete = 'couldComplete',
    isCompleted = 'isCompleted',
}

@Injectable()
export class TaskService {
    constructor(
        private readonly statisticService: StatisticService,
        @InjectRepository(ChatwoLog)
        private readonly logRepository: Repository<ChatwoLog>,
        private readonly dataSource: DataSource,
        private readonly itemService: ItemService,
    ) {
    }

    async getTaskState(account: ApiAccount, taskId: string, manager: EntityManager) {
        const config = configManager.archievementTaskMap.get(taskId);
        if (!config) {
            throw new NotFoundException(`Task with id ${taskId} not found`);
        }
        let logger: ChatwoLog | null = null
        if (config.Type === ArchievementTaskType.daily) {
            const today = todayStart();
            logger = await manager.findOne(ChatwoLog, {
                where: {
                    createdAt: MoreThanOrEqual(today),
                    tags: ArrayContains([`task`, config.Name, account.custom_id || '']),
                }
            });
        } else {
            logger = await manager.findOne(ChatwoLog, {
                where: {
                    tags: ArrayContains([`task`, config.Name, account.custom_id || '']),
                }
            });
        }
        const progress = logger ? config.Test : Number(await this.statisticService.execDsl(config.Progress, account));

        return {
            name: config.Name,
            progress,
            status: logger ? TaskStatus.isCompleted : (progress >= config.Test ? TaskStatus.couldComplete : TaskStatus.notComplete),
        };
    }

    async getTask(account: ApiAccount, taskId: string) {
        return this.getTaskState(account, taskId, this.dataSource.manager);
    }

    async getAllTask(account: ApiAccount) {
        const configs = configManager.archievementTask;
        const results: {
            name: string;
            progress: number;
            status: TaskStatus;
        }[] = [];
        for (const config of configs) {
            results.push(await this.getTaskState(account, config.Name, this.dataSource.manager));
        }
        return results;
    }

    async finishedTask(account: ApiAccount, taskId: string) {
        return autoPatch(this.dataSource, async (manager) => {

            const task = await this.getTaskState(account, taskId, manager);
            if (task.status !== TaskStatus.couldComplete) {
                throw new Error(`Task ${taskId} could not be completed`);
            }
            const config = configManager.archievementTaskMap.get(taskId)!;
            const tags = ['task', account.custom_id!, config.Name];
            const items = await this.itemService.gainItems(
                manager,
                account,
                config.Gain
            );
            tags.push(...items.map(i => i.nakamaId));
            return {
                result: items,
                message: `Successfully finished task ${taskId}`,
                tags,
            };
        });
    }
}
