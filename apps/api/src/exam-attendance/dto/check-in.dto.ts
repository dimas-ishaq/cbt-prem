import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CheckInDto {
  @IsUUID()
  examId: string;

  @IsString()
  qrPayload: string;
}

export class CheckInResponseDto {
  success: boolean;
  message: string;
  attendance?: {
    id: string;
    studentId: string;
    studentName: string;
    nis: string;
    status: string;
    checkedInAt: Date;
  };
}

export class AttendanceFilterDto {
  @IsUUID()
  @IsOptional()
  examId?: string;
}
