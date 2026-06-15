import { IsString, IsOptional } from 'class-validator';

export class StartSessionDto {
  @IsString()
  examId: string;

  @IsString()
  @IsOptional()
  token?: string;

}
