import { IsBoolean, IsDate, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  msOid?: string;

  @IsDate()
  @IsOptional()
  lastLoginAt?: Date;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
