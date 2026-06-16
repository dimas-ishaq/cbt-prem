import { PartialType } from '@nestjs/mapped-types';
import { CreateExamDto } from './create-exam.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateExamDto extends PartialType(CreateExamDto) {
  @IsBoolean()
  @IsOptional()
  showScore?: boolean;
}
