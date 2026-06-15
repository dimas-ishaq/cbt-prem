import { IsString, IsOptional } from 'class-validator';

export class UpdateExamGroupDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  academicYear?: string;

  @IsString()
  @IsOptional()
  semester?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;
}
