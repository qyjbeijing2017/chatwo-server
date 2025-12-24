import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { StatisticService } from './statistic.service';
import { Server } from 'src/auth/server.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Account } from 'src/auth/Account.decorator';
import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';
import { FlyDto } from './dto/fly.dto';
import { KilledDto } from './dto/pve.dto';
import { LogDto } from './dto/log.dto';

@Controller('statistic')
export class StatisticController {
    constructor(readonly statisticService: StatisticService) { }

    @ApiBearerAuth()
    @Get('')
    async getStatistics(
        @Account() account: ApiAccount,
        @Query() logDto: LogDto,
    ) {
        return this.statisticService.getAllStatistics(logDto, account);
    }

    @ApiBearerAuth()
    @Post('fly-in')
    async flyIn(@Account() account: ApiAccount) {
        return this.statisticService.flyIn(account);
    }

    @ApiBearerAuth()
    @Post('fly')
    async fly(@Account() account: ApiAccount, @Body() flyDto: FlyDto) {
        return this.statisticService.fly(account, flyDto);
    }

    @ApiBearerAuth()
    @Post('pve')
    async pve(@Account() account: ApiAccount, @Body() body: KilledDto) {
        return this.statisticService.pve(account, body);
    }

    @ApiBearerAuth()
    @Post('pvp')
    async pvp(@Account() account: ApiAccount, @Body() body: KilledDto) {
        return this.statisticService.pvp(account, body);
    }

    @ApiBearerAuth()
    @Get('dsl/:query')
    async getDslStatistics(
        @Account() account: ApiAccount,
        @Param('query') query: string,
    ) {
        return this.statisticService.dslQuery(account, query);
    }

    @ApiBearerAuth()
    @Post('tutorial')
    async tutorial(
        @Account() account: ApiAccount,
    ) {
        return this.statisticService.completeTutorial(account);
    }
}
