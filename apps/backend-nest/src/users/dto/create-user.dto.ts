import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateUserDto {
  @IsUUID()
  workspaceId: string;

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
}
