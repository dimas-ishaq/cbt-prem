import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateQuestionBankDto {
  @IsString()
  name: string;

  @IsUUID()
  subjectId: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsUUID()
  @IsOptional()
  teacherId?: string;
}
