import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { TaskFrequency, TaskImpact } from '@prisma/client';

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
