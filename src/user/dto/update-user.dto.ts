import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsObject, IsNotEmpty } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  oculusId?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty()
  @IsOptional()
  @IsObject()
  wallet?: Record<string, number>;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string;
}
