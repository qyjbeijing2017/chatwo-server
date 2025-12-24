import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { Injectable, NotFoundException } from '@nestjs/common';
import { configManager } from 'src/configV2/config';
import { StatisticService } from 'src/statistic/statistic.service';

@Injectable()
export class TaskService {
    constructor(
        private readonly statisticService: StatisticService,
    ) {
    }

    async getTask(account: ApiAccount, taskId: string) {
        const config = configManager.archievementTaskMap.get(taskId);
        if (!config) {
            throw new NotFoundException(`Task with id ${taskId} not found`);
        }
        const progress = await this.statisticService.execDsl(config.Progress, account);
        const isComplete = await this.statisticService.execDsl(config.Test, account, { progress });
        return {
            name: taskId,
            progress,
            isComplete,
        }
    }

    async getAllTask(account: ApiAccount) {
        const configs = configManager.archievementTask;
        const results: {
            name: string;
            progress: any;
            isComplete: any;
        }[] = [];
        for (const config of configs) {
            results.push(await this.getTask(account, config.Name));
        }
        return results;
    }
}
