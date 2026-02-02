import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { TaskFrequency, TaskImpact } from '@prisma/client';

export class CreateComplianceMasterDto {
  @IsString()
  @IsNotEmpty()
  complianceId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  lawId: string;

  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @IsEnum(TaskFrequency)
  @IsOptional()
  frequency?: TaskFrequency;

  @IsEnum(TaskImpact)
  @IsOptional()
  impact?: TaskImpact;
}
