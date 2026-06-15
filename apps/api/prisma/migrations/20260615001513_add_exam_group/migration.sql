-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "examGroupId" TEXT;

-- CreateTable
CREATE TABLE "ExamGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "academicYear" TEXT,
    "semester" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamGroup_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_examGroupId_fkey" FOREIGN KEY ("examGroupId") REFERENCES "ExamGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
