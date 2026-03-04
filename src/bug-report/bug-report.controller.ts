import { Controller, Post } from '@nestjs/common';
import { Public } from 'src/auth/public.decorator';
import { BugReportService } from './bug-report.service';
import { BugDto } from './bug.dto';

@Controller('bug-report')
export class BugReportController {
    constructor(private readonly bugReportService: BugReportService) {}
    @Post()
    @Public()
    async reportBug(dto: BugDto) {
        return this.bugReportService.reportBug(dto);
    }
}
