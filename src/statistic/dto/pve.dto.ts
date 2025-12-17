import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class KilledDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  whoWasKilled: string;
}
