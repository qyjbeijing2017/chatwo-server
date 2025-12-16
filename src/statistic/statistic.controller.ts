import { Controller, Get } from '@nestjs/common';
import { StatisticService } from './statistic.service';
import { Server } from 'src/auth/server.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('statistic')
export class StatisticController {
    constructor(readonly statisticService: StatisticService) { }

    @ApiBearerAuth()
    @Get()
    @Server()
    async getStatistics() {
        return this.statisticService.getAllStatistics();
    }


}
