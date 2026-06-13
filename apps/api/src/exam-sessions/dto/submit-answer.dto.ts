import { IsString, IsOptional, IsUUID } from 'class-validator';

export class SubmitAnswerDto {
  @IsUUID()
  questionId: string;

  @IsString()
  @IsOptional()
  selectedOptionId?: string;

  @IsString()
  @IsOptional()
  essayAnswer?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;
}
