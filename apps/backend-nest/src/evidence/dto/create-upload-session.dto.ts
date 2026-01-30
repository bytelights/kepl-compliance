import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class CreateUploadSessionDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsInt()
  @Min(1)
  fileSize: number;

  @IsString()
  @IsNotEmpty()
  mimeType: string;
}
