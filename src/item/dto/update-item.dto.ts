import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ItemType } from '../../entities/item.entity';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateItemDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  key?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  type?: ItemType;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  ownerId?: number;
}
