import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class CompleteUploadDto {
  @IsString()
  @IsNotEmpty()
  uploadSessionId: string;

  @IsString()
  @IsNotEmpty()
  itemId: string;

  @IsString()
  @IsNotEmpty()
  webUrl: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(1)
  sizeBytes: number;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsString()
  @IsNotEmpty()
  siteId: string;

  @IsString()
  @IsNotEmpty()
  driveId: string;

  @IsString()
  @IsNotEmpty()
  path: string;
}
