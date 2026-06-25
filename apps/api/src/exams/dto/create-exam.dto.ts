import { IsString, IsOptional, IsUUID, IsDateString, IsInt, IsBoolean, IsEnum, IsArray, IsNotEmpty, ArrayMinSize } from 'class-validator';
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
  requireSeb?: boolean;

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
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  @IsOptional()
  questionIds?: string[];

  @IsUUID()
  @IsNotEmpty()
  examGroupId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  @IsOptional()
  rombelIds?: string[];

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  majorIds?: string[];

  @IsEnum(ExamStatus)
  @IsOptional()
  status?: ExamStatus;
}
