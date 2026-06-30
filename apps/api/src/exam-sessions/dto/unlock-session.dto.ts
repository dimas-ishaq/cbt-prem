import { IsString, IsUUID } from 'class-validator';

export class UnlockSessionDto {
  @IsString()
  sessionId: string;

  @IsString()
  token: string;
}
