import {
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType } from '@prisma/client';

export class NotificationPolicyItemDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsBoolean()
  isEnabled: boolean;
}

export class UpdateNotificationPolicyDto {
  @IsString()
  roleId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationPolicyItemDto)
  policies: NotificationPolicyItemDto[];
}
