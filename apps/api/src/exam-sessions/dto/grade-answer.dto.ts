import { IsInt, Min, Max, IsString, IsOptional } from 'class-validator';

export class GradeAnswerDto {
  @IsInt()
  @Min(0)
  score: number;

  @IsString()
  @IsOptional()
  feedback?: string;
}
