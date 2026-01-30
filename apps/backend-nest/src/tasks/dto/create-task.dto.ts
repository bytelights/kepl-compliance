import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  complianceId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  lawId: string;

  @IsUUID()
  departmentId: string;

  @IsUUID()
  entityId: string;

  @IsUUID()
  @IsOptional()
  complianceMasterId?: string;

  @IsUUID()
  ownerId: string; // Single assignee

  @IsUUID()
  reviewerId: string; // Single reviewer

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
