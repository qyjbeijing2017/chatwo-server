import { Injectable } from '@nestjs/common';
import { BugDto } from './bug.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatwoBug } from 'src/entities/bug.entity';

@Injectable()
export class BugReportService {
    constructor(
        @InjectRepository(ChatwoBug)
        private readonly bugRepository: Repository<ChatwoBug>,
    ) { }

    reportBug(dto: BugDto) {
        const bug = this.bugRepository.create(dto);
        return this.bugRepository.save(bug);
    }
}
