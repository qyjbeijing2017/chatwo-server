import { Controller, Get, Param, Post, Patch, Body } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { TaskService } from './task.service';
import { Account } from 'src/auth/Account.decorator';
import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { SubmitItemDto } from './submit-Item.dto';

@Controller('task')
export class TaskController {
    constructor(
        private readonly taskService: TaskService, // Replace 'any' with the actual service type
    ) { }

    @ApiBearerAuth()
    @Get()
    async getTasks(
        @Account() account: ApiAccount,
    ) {
        return this.taskService.getTasks(account);
    }

    @ApiBearerAuth()
    @Post(':taskId')
    async claimTaskReward(
        @Account() account: ApiAccount,
        @Param('taskId') taskId: string,
    ) {
        return this.taskService.claimTaskReward(account, taskId);
    }

    @ApiBearerAuth()
    @Patch(':taskId')
    async submitItem(
        @Account() account: ApiAccount,
        @Param('taskId') taskId: string,
        @Body() submitItemDto: SubmitItemDto,
    ) {
        return this.taskService.submitItem(account, taskId, submitItemDto);
    }
}
