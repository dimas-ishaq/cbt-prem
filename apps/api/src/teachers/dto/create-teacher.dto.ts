import { IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateTeacherDto {
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  fullName: string;

  @IsString()
  @IsOptional()
  nip?: string;
}
