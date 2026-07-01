import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class SubmitAnswerDto {
  @IsUUID()
  questionId: string;

  @IsString()
  @IsOptional()
  selectedOptionId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10000)
  essayAnswer?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;
}
