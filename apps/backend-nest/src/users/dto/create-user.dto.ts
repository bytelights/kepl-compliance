import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsEnum(['admin', 'reviewer', 'task_owner'])
  @IsOptional()
  role?: 'admin' | 'reviewer' | 'task_owner';

  @IsString()
  @IsOptional()
  msOid?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
