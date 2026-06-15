/*
  Warnings:

  - You are about to drop the column `password` on the `Exam` table. All the data in the column will be lost.
  - You are about to drop the column `class` on the `Student` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Exam" DROP COLUMN "password";

-- AlterTable
ALTER TABLE "ExamGroup" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "class",
ADD COLUMN     "rombelId" TEXT;

-- CreateTable
CREATE TABLE "rombels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "majorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rombels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rombels_name_key" ON "rombels"("name");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_rombelId_fkey" FOREIGN KEY ("rombelId") REFERENCES "rombels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rombels" ADD CONSTRAINT "rombels_majorId_fkey" FOREIGN KEY ("majorId") REFERENCES "majors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
