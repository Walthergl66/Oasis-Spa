import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import {
  NotificationChannel,
  NotificationType,
} from '../../common/enums/database.enums';

export class CreateNotificationDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsString()
  @Length(2, 150)
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsBoolean()
  isSent?: boolean;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
