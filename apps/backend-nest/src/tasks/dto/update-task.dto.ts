import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { TaskFrequency, TaskImpact } from '@prisma/client';

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

  @IsEnum(TaskFrequency)
  @IsOptional()
  frequency?: TaskFrequency;

  @IsEnum(TaskImpact)
  @IsOptional()
  impact?: TaskImpact;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
