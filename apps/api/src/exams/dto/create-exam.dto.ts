import { IsString, IsOptional, IsUUID, IsDateString, IsInt, IsBoolean, IsEnum, IsArray } from 'class-validator';
import { ExamStatus } from '@prisma/client';

export class CreateExamDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  subjectId: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsInt()
  duration: number;

  @IsString()
  @IsOptional()
  token?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsInt()
  @IsOptional()
  maxAttempts?: number;

  @IsBoolean()
  @IsOptional()
  randomizeSoal?: boolean;

  @IsBoolean()
  @IsOptional()
  randomizeOpsi?: boolean;

  @IsInt()
  @IsOptional()
  passingGrade?: number;

  @IsString()
  @IsOptional()
  sebConfigKey?: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  questionIds?: string[];
}
