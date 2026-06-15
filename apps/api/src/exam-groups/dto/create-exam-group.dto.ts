import { IsString, IsOptional } from 'class-validator';

export class CreateExamGroupDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  academicYear?: string;

  @IsString()
  @IsOptional()
  semester?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
