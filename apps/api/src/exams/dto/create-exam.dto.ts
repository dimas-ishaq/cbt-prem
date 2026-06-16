import { IsString, IsOptional, IsUUID, IsDateString, IsInt, IsBoolean, IsEnum, IsArray, IsNotEmpty } from 'class-validator';
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

  @IsString()
  @IsOptional()
  sebBrowserKey?: string;

  @IsBoolean()
  @IsOptional()
  blockKeyCopyPaste?: boolean;

  @IsBoolean()
  @IsOptional()
  forceFullscreen?: boolean;

  @IsInt()
  @IsOptional()
  maxViolations?: number;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  questionIds?: string[];

  @IsUUID()
  @IsNotEmpty()
  examGroupId: string;
}
