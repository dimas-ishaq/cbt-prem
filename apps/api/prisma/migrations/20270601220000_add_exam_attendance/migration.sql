-- Migration to add ExamAttendance table for attendance tracking

CREATE TYPE "AttendanceStatus" AS ENUM (
    'PRESENT',
    'LATE',
    'ABSENT'
);

CREATE TABLE "ExamAttendance" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedInBy" TEXT,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "qrPayload" TEXT,

    CONSTRAINT "ExamAttendance_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExamAttendance_examId_studentId_key" ON "ExamAttendance"("examId", "studentId");
CREATE INDEX "ExamAttendance_examId_idx" ON "ExamAttendance"("examId");
CREATE INDEX "ExamAttendance_studentId_idx" ON "ExamAttendance"("studentId");

ALTER TABLE "ExamAttendance" ADD CONSTRAINT "ExamAttendance_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamAttendance" ADD CONSTRAINT "ExamAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamAttendance" ADD CONSTRAINT "ExamAttendance_checkedInBy_fkey" FOREIGN KEY ("checkedInBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;