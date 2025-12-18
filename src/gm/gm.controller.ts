import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { GmService } from './gm.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Server } from 'src/auth/server.decorator';
import { LogDto } from 'src/statistic/dto/log.dto';
import { AddSSDto } from './dto/addSS.dto';

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
    @Server()
    async addSSGM(
        @Body() dto: AddSSDto,
    ) {
        return this.gmService.addSS(dto);
    }
}
