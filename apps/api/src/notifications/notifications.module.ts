import { Module, forwardRef } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationPoliciesController } from './notification-policies.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [PrismaModule, forwardRef(() => RealtimeModule)],
  controllers: [NotificationsController, NotificationPoliciesController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
