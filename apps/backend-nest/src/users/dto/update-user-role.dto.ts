import { IsEnum } from 'class-validator';

export class UpdateUserRoleDto {
  @IsEnum(['admin', 'reviewer', 'task_owner'])
  role: 'admin' | 'reviewer' | 'task_owner';
}
