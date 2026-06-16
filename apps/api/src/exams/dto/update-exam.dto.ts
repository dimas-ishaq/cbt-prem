import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateExamDto {
  @IsBoolean()
  @IsOptional()
  showScore?: boolean;
}
