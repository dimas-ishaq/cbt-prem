import { IsEnum, IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export enum NotificationType {
  EXAM_SUBMITTED = 'EXAM_SUBMITTED',
  EXAM_AUTO_SUBMIT = 'EXAM_AUTO_SUBMIT',
  VIOLATION_DETECTED = 'VIOLATION_DETECTED',
  IMPORT_COMPLETED = 'IMPORT_COMPLETED',
  IMPORT_FAILED = 'IMPORT_FAILED',
  EXAM_REMINDER = 'EXAM_REMINDER',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum NotificationTargetType {
  USER = 'USER',
  ROLE = 'ROLE',
  CLASS = 'CLASS', // rombel
  MAJOR = 'MAJOR',
  EXAM = 'EXAM',
}

export class NotificationTargetDto {
  @IsEnum(NotificationTargetType)
  @ApiProperty({ enum: NotificationTargetType })
  type: NotificationTargetType;

  @IsString()
  @ApiProperty()
  id: string;
}

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @IsEnum(NotificationPriority)
  @ApiPropertyOptional({ enum: NotificationPriority })
  priority?: NotificationPriority;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  title: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  message: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  referenceId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  referenceType?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationTargetDto)
  @ApiProperty({ type: [NotificationTargetDto] })
  targets: NotificationTargetDto[];
}
