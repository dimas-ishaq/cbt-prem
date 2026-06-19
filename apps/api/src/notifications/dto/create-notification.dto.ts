import { IsEnum, IsNotEmpty, IsOptional, IsString, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType, NotificationPriority } from '@prisma/client';

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
