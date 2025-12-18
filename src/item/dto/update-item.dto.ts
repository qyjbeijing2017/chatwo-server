import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ItemType } from '../../entities/item.entity';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateItemDto {
  @ApiProperty()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty()
  meta: any;
}
