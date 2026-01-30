import { IsString, IsNotEmpty } from 'class-validator';

export class CompleteTaskDto {
  @IsString()
  @IsNotEmpty()
  comment: string;
}
