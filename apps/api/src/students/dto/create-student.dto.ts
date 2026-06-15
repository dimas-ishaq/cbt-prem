import { IsString, IsOptional, IsEmail } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateStudentDto {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  fullName: string;

  @IsString()
  nis: string;

  @IsString()
  @IsOptional()
  rombelId?: string;
}
