import { IsString, IsNotEmpty } from 'class-validator';

export class SkipTaskDto {
  @IsString()
  @IsNotEmpty()
  remarks: string;
}
