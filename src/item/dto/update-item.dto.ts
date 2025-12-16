import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ItemType } from '../../entities/item.entity';

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsNumber()
  type?: ItemType;

  @IsOptional()
  @IsNumber()
  ownerId?: number;
}
