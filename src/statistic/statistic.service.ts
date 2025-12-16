import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatwoLog } from 'src/entities/log.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StatisticService {
    constructor(
        @InjectRepository(ChatwoLog)
        private readonly logRepository: Repository<ChatwoLog>,
    ) { }

    async getAllStatistics() {
        return this.logRepository.find();
    }
}
