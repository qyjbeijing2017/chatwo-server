import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { TaskService } from './task.service';
import { Account } from 'src/auth/Account.decorator';
import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';

@Controller('task')
export class TaskController {
    constructor(
        private readonly taskService: TaskService, // Replace 'any' with the actual service type
    ) { }



    @ApiBearerAuth()
    @Get(':taskId')
    async getTaskState(
        @Account() account: ApiAccount,
        @Param('taskId') taskId: string,
    ) {
        return null;
    }

    @ApiBearerAuth()
    @Get()
    async getAllTaskState() {
        return null;
    }


}
