import { IsOptional, IsString, IsObject } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  oculusId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  wallet?: Record<string, number>;
}
