import { IsString, IsEnum, IsOptional, IsInt, IsArray, ValidateNested, IsBoolean, IsUUID } from 'class-validator';
import { QuestionType, Difficulty } from '@prisma/client';
import { Type } from 'class-transformer';

export class QuestionOptionDto {
  @IsString()
  content: string;

  @IsBoolean()
  isCorrect: boolean;

  @IsInt()
  @IsOptional()
  order?: number;
}

export class CreateQuestionDto {
  @IsUUID()
  questionBankId: string;

  @IsEnum(QuestionType)
  type: QuestionType;

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @IsString()
  @IsOptional()
  mediaType?: string;

  @IsEnum(Difficulty)
  @IsOptional()
  difficulty?: Difficulty;

  @IsInt()
  @IsOptional()
  points?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  @IsOptional()
  options?: QuestionOptionDto[];
}
