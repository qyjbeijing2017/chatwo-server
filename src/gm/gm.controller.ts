import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { GmService } from './gm.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Server } from 'src/auth/server.decorator';
import { LogDto } from 'src/statistic/dto/log.dto';
import { AddSSDto } from './dto/addSS.dto';
import { Account } from 'src/auth/Account.decorator';
import { ApiAccount } from '@heroiclabs/nakama-js/dist/api.gen';

@Controller('gm')
export class GmController {
    constructor(private readonly gmService: GmService) { }

    @ApiBearerAuth()
    @Get('statistics')
    @Server()
    async getStatisticsGM(
        @Query() logDto: LogDto,
    ) {
        return this.gmService.getAllStatistics(logDto);
    }

    @ApiBearerAuth()
    @Post('syncFromNakama')
    @Server()
    async syncFromNakamaGM() {
        return this.gmService.syncAllFromNakama();
    }


    @ApiBearerAuth()
    @Post('syncOneFromNakama/:customId')
    @Server()
    async syncOneFromNakamaGM(
        @Query('customId') customId: string,
    ) {
        return this.gmService.syncOneFromNakama(customId);
    }

    @ApiBearerAuth()
    @Post('addSS')
    async addSSGM(
        @Account() account: ApiAccount  ,
        @Body() dto: AddSSDto,
    ) {
        return this.gmService.addSS(account,dto);
    }
}
