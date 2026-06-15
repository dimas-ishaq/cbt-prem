import { IsString, IsOptional, IsUUID } from 'class-validator';

export class UpdateRombelDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsUUID()
  @IsOptional()
  majorId?: string;
}
