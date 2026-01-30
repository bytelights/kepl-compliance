import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CreateMasterDataDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  name: string;
}
