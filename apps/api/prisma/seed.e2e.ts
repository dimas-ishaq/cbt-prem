import { PrismaClient, Role, QuestionType, Difficulty, ExamStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// -------------------------------------------------------------------
// NOTE: All UUIDs below are deterministic (fixed) so tests can rely on them.
// -------------------------------------------------------------------
export const TEST_SUPERADMIN_USER_ID = '00000000-0000-0000-0000-000000000001';
export const TEST_TEACHER_USER_ID    = '00000000-0000-0000-0000-000000000002';
export const TEST_STUDENT_USER_ID    = '00000000-0000-0000-0000-000000000003';
export const TEST_MAJOR_ID           = '11111111-1111-1111-1111-111111111111';
export const TEST_ROMBEL_ID          = '22222222-2222-2222-2222-222222222222';
export const TEST_SUBJECT_ID         = '33333333-3333-3333-3333-333333333333';
export const TEST_EXAM_GROUP_ID      = '44444444-4444-4444-4444-444444444444';
export const TEST_QUESTION_BANK_ID   = '55555555-5555-5555-5555-555555555555';
export const TEST_QUESTION_ID_1      = '66666666-6666-6666-6666-666666666666';
export const TEST_QUESTION_ID_2      = '77777777-7777-7777-7777-777777777777';
export const TEST_OPTION_ID_1        = '88888888-8888-8888-8888-888888888888';
export const TEST_OPTION_ID_2        = '99999999-9999-9999-9999-999999999999';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Cleaning E2E database...');
  await prisma.$executeRawUnsafe('DELETE FROM "_SubjectToTeacher"');
  await prisma.answer.deleteMany({});
  await prisma.violation.deleteMany({});
  await prisma.examSession.deleteMany({});
  await prisma.examQuestion.deleteMany({});
  await prisma.exam.deleteMany({});
  await prisma.examGroup.deleteMany({});
  await prisma.questionOption.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.questionBank.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.rombel.deleteMany({});
  await prisma.major.deleteMany({});
  console.log('🧹 E2E Database cleaned.');

  // -----------------------------------------------------------------
  // Password hashes (deterministic)
  // -----------------------------------------------------------------
  const pwdAdmin   = await bcrypt.hash('admin123', 10);
  const pwdTeacher = await bcrypt.hash('teacher123', 10);
  const pwdStudent = await bcrypt.hash('student123', 10);

  // -----------------------------------------------------------------
  // 1. Settings (skip – already seeded in prod)
  // -----------------------------------------------------------------
  // – nothing to seed here for E2E

  // -----------------------------------------------------------------
  // 2. Majors
  // -----------------------------------------------------------------
  await prisma.major.create({
    data: {
      id: TEST_MAJOR_ID,
      name: 'Test Major',
      code: 'TEST',
    },
  });

  // -----------------------------------------------------------------
  // 3. Rombels (one per major)
  // -----------------------------------------------------------------
  await prisma.rombel.create({
    data: {
      id: TEST_ROMBEL_ID,
      name: 'Test Rombel',
      majorId: TEST_MAJOR_ID,
    },
  });

  // -----------------------------------------------------------------
  // 4. Subjects
  // -----------------------------------------------------------------
  await prisma.subject.create({
    data: {
      id: TEST_SUBJECT_ID,
      name: 'Test Subject',
      code: 'TEST-SUB',
    },
  });

  // -----------------------------------------------------------------
  // 5. Users
  // -----------------------------------------------------------------
  await prisma.user.create({
    data: {
      id: TEST_TEACHER_USER_ID,
      username: 'test-teacher',
      email: 'teacher@test.com',
      password: pwdTeacher,
      fullName: 'Test Teacher',
      role: Role.SUPER_ADMIN,
    },
  });
  await prisma.teacher.create({ data: { id: 'd4444444-4444-4444-4444-444444444444', userId: TEST_TEACHER_USER_ID } });

  await prisma.user.create({
    data: {
      id: TEST_STUDENT_USER_ID,
      username: 'test-student',
      email: 'student@test.com',
      password: pwdStudent,
      fullName: 'Test Student',
      role: Role.SISWA,
    },
  });
  await prisma.student.create({ data: { id: TEST_STUDENT_USER_ID, nis: '99999', userId: TEST_STUDENT_USER_ID, rombelId: TEST_ROMBEL_ID, majorId: TEST_MAJOR_ID } });

  // -----------------------------------------------------------------
  // 6. Teacher → Subjects linkage (teacher teaches the test subject)
  // -----------------------------------------------------------------
  await prisma.teacher.update({
    where: { id: 'd4444444-4444-4444-4444-444444444444' },
    data: { subjects: { connect: { id: TEST_SUBJECT_ID } } },
  });

  // -----------------------------------------------------------------
  // 7. Exam Group
  // -----------------------------------------------------------------
  await prisma.examGroup.create({
    data: {
      id: TEST_EXAM_GROUP_ID,
      name: 'Test Exam Group',
      academicYear: '2025/2026',
      semester: 'Ganjil',
    },
  });

  // -----------------------------------------------------------------
  // 8. Question Bank linked to subject & teacher
  // -----------------------------------------------------------------
  await prisma.questionBank.create({
    data: {
      id: TEST_QUESTION_BANK_ID,
      name: 'Test Question Bank',
      subjectId: TEST_SUBJECT_ID,
      teacherId: 'd4444444-4444-4444-4444-444444444444',
    },
  });

  // -----------------------------------------------------------------
  // 9. Questions & Options
  // -----------------------------------------------------------------
  await prisma.question.createMany({
    data: [
      {
        id: TEST_QUESTION_ID_1,
        questionBankId: TEST_QUESTION_BANK_ID,
        content: 'What is 2 + 2?',
        type: QuestionType.PILIHAN_GANDA,
        difficulty: Difficulty.MUDAH,
        points: 10,
        tags: [],
      },
      {
        id: TEST_QUESTION_ID_2,
        questionBankId: TEST_QUESTION_BANK_ID,
        content: "Explain Newton's second law.",
        type: QuestionType.ESSAY,
        difficulty: Difficulty.SULIT,
        points: 15,
        tags: [],
      },
    ],
  });

  await prisma.questionOption.createMany({
    data: [
      {
        id: TEST_OPTION_ID_1,
        questionId: TEST_QUESTION_ID_1,
        content: '3',
        isCorrect: false,
        order: 1,
      },
      {
        id: TEST_OPTION_ID_2,
        questionId: TEST_QUESTION_ID_1,
        content: '4',
        isCorrect: true,
        order: 2,
      },
    ],
  });

  // -----------------------------------------------------------------
  // 10. Exam linked to subject, teacher, examGroup
  // -----------------------------------------------------------------
  await prisma.exam.create({
    data: {
      id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      title: 'Test Exam',
      description: 'E2E test exam',
      subjectId: TEST_SUBJECT_ID,
      teacherId: 'd4444444-4444-4444-4444-444444444444',
      examGroupId: TEST_EXAM_GROUP_ID,
      startTime: new Date(Date.now() - 60000),
      endTime: new Date(Date.now() + 3600000),
      duration: 60,
      status: ExamStatus.PUBLISHED,
      showScore: true,
      examQuestions: {
        create: [
          { questionId: TEST_QUESTION_ID_1, order: 1, points: 10 },
          { questionId: TEST_QUESTION_ID_2, order: 2, points: 15 },
        ],
      },
      targetRombels: {
        create: [{ rombelId: TEST_ROMBEL_ID }],
      },
    },
  });

  console.log('✅ Test seed data created');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });