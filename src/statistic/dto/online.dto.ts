import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class OnlineDto {
  @ApiProperty()
  @IsNumber()
  minutes: number;
}
