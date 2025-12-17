import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class FlyDto {
  @ApiProperty()
  @IsNumber()
  meters: number;
}
