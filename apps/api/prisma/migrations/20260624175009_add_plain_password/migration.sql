/*
  Warnings:

  - You are about to drop the column `userId` on the `Notification` table. All the data in the column will be lost.
  - Added the required column `type` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EXAM_SUBMITTED', 'EXAM_AUTO_SUBMIT', 'VIOLATION_DETECTED', 'IMPORT_COMPLETED', 'IMPORT_FAILED', 'EXAM_REMINDER', 'SESSION_EXPIRED', 'SYSTEM_ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "isGraded" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "blockKeyCopyPaste" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "forceFullscreen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxViolations" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "requireSeb" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showScore" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "userId",
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "referenceId" TEXT,
ADD COLUMN     "referenceType" TEXT,
ADD COLUMN     "type" "NotificationType" NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "photo" TEXT,
ADD COLUMN     "plainPassword" TEXT;

-- CreateTable
CREATE TABLE "ExamTargetRombel" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "rombelId" TEXT NOT NULL,

    CONSTRAINT "ExamTargetRombel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamTargetMajor" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "majorId" TEXT NOT NULL,

    CONSTRAINT "ExamTargetMajor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRecipient" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExamTargetRombel_examId_rombelId_key" ON "ExamTargetRombel"("examId", "rombelId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamTargetMajor_examId_majorId_key" ON "ExamTargetMajor"("examId", "majorId");

-- CreateIndex
CREATE INDEX "NotificationRecipient_userId_isRead_idx" ON "NotificationRecipient"("userId", "isRead");

-- CreateIndex
CREATE INDEX "NotificationRecipient_userId_createdAt_idx" ON "NotificationRecipient"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationRecipient_notificationId_userId_key" ON "NotificationRecipient"("notificationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_type_key" ON "NotificationPreference"("userId", "type");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "ExamTargetRombel" ADD CONSTRAINT "ExamTargetRombel_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamTargetRombel" ADD CONSTRAINT "ExamTargetRombel_rombelId_fkey" FOREIGN KEY ("rombelId") REFERENCES "rombels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamTargetMajor" ADD CONSTRAINT "ExamTargetMajor_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamTargetMajor" ADD CONSTRAINT "ExamTargetMajor_majorId_fkey" FOREIGN KEY ("majorId") REFERENCES "majors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
