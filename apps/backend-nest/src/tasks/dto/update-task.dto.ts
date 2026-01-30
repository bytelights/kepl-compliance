import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  lawId?: string;

  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @IsUUID()
  @IsOptional()
  entityId?: string;

  @IsUUID()
  @IsOptional()
  complianceMasterId?: string;

  @IsUUID()
  @IsOptional()
  ownerId?: string;

  @IsUUID()
  @IsOptional()
  reviewerId?: string;

  @IsEnum([
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'HALF_YEARLY',
    'YEARLY',
    'ONE_TIME',
  ])
  @IsOptional()
  frequency?: string;

  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  @IsOptional()
  impact?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
