import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ExamStatus } from '@prisma/client';

@Injectable()
export class ExamSchedulerService {
  private readonly logger = new Logger(ExamSchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExamStatusUpdates() {
    this.logger.debug('Running automated exam status updates check...');
    const now = new Date();

    try {
      // 1. Update PUBLISHED -> ONGOING
      const publishedToOngoing = await this.prisma.exam.updateMany({
        where: {
          status: ExamStatus.PUBLISHED,
          startTime: {
            lte: now,
          },
          endTime: {
            gt: now,
          },
        },
        data: {
          status: ExamStatus.ONGOING,
        },
      });

      if (publishedToOngoing.count > 0) {
        this.logger.log(
          `Updated ${publishedToOngoing.count} exam(s) from PUBLISHED to ONGOING status.`,
        );
      }

      // 2. Update ONGOING -> COMPLETED
      const ongoingToCompleted = await this.prisma.exam.updateMany({
        where: {
          status: ExamStatus.ONGOING,
          endTime: {
            lte: now,
          },
        },
        data: {
          status: ExamStatus.COMPLETED,
        },
      });

      if (ongoingToCompleted.count > 0) {
        this.logger.log(
          `Updated ${ongoingToCompleted.count} exam(s) from ONGOING to COMPLETED status.`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to update automated exam statuses:', error);
    }
  }
}
