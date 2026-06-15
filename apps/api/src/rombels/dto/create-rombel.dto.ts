import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateRombelDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsNotEmpty()
  majorId: string;
}
