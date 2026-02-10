import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CompleteTaskDto {
  @IsString()
  @IsNotEmpty()
  comment: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;
}
