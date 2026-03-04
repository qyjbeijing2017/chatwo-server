import { Module } from '@nestjs/common';
import { BugReportController } from './bug-report.controller';
import { BugReportService } from './bug-report.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatwoBug } from 'src/entities/bug.entity';


@Module({
  imports: [TypeOrmModule.forFeature([ChatwoBug]),],
  controllers: [BugReportController],
  providers: [BugReportService]
})
export class BugReportModule { }
