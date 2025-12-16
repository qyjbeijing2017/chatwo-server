import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { ItemType } from '../../entities/item.entity';

export class CreateItemDto {
  @IsNotEmpty()
  @IsString()
  key: string;

  @IsNotEmpty()
  @IsNumber()
  type: ItemType;

  @IsNotEmpty()
  @IsString()
  userNakamaId: string;
}
