import { PrismaClient, Role, QuestionType, Difficulty, ExamStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcryptjs';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding...');

  // 1. Clean existing data
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.violation.deleteMany({});
  await prisma.answer.deleteMany({});
  await prisma.examSession.deleteMany({});
  await prisma.examQuestion.deleteMany({});
  await prisma.exam.deleteMany({});
  await prisma.questionOption.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.questionBank.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Database cleaned.');

  // 2. Hash Password
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const teacherPassword = await bcrypt.hash('guru123', salt);
  const studentPassword = await bcrypt.hash('siswa123', salt);

  // 3. Create Users
  const superAdmin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@cbtenterprise.com',
      password: adminPassword,
      fullName: 'Super Admin CBT',
      role: Role.SUPER_ADMIN,
    },
  });

  const teacherUser = await prisma.user.create({
    data: {
      username: 'guru1',
      email: 'guru1@cbtenterprise.com',
      password: teacherPassword,
      fullName: 'Budi Santoso, S.Pd',
      role: Role.GURU,
    },
  });

  const studentUser = await prisma.user.create({
    data: {
      username: 'siswa1',
      email: 'siswa1@cbtenterprise.com',
      password: studentPassword,
      fullName: 'Muhammad Rizky',
      role: Role.SISWA,
    },
  });

  console.log('Users created.');

  // 4. Create Subjects
  const mathSubject = await prisma.subject.create({
    data: {
      name: 'Matematika Wajib',
      code: 'MATH101',
      description: 'Mata pelajaran matematika dasar untuk kelas X',
    },
  });

  // 5. Create Teacher & Student profiles
  const teacher = await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      nip: '198801022015031002',
      subjects: {
        connect: { id: mathSubject.id },
      },
    },
  });

  const student = await prisma.student.create({
    data: {
      userId: studentUser.id,
      nis: '202310452',
      class: 'X-MIPA-1',
    },
  });

  console.log('Profiles created.');

  // 6. Create Question Bank
  const questionBank = await prisma.questionBank.create({
    data: {
      name: 'Bank Soal Aljabar Linear',
      subjectId: mathSubject.id,
      teacherId: teacher.id,
      category: 'Ulangan Harian',
    },
  });

  console.log('Question bank created.');

  // 7. Create Questions
  // Question 1: PILIHAN_GANDA
  const q1 = await prisma.question.create({
    data: {
      questionBankId: questionBank.id,
      type: QuestionType.PILIHAN_GANDA,
      content: 'Tentukan nilai x dari persamaan linear berikut: 3x + 5 = 20',
      difficulty: Difficulty.MUDAH,
      points: 10,
      options: {
        create: [
          { content: '5', isCorrect: true, order: 1 },
          { content: '4', isCorrect: false, order: 2 },
          { content: '6', isCorrect: false, order: 3 },
          { content: '3', isCorrect: false, order: 4 },
        ],
      },
    },
  });

  // Question 2: BENAR_SALAH
  const q2 = await prisma.question.create({
    data: {
      questionBankId: questionBank.id,
      type: QuestionType.BENAR_SALAH,
      content: 'Persamaan y = mx + c selalu menggambarkan sebuah grafik garis lurus.',
      difficulty: Difficulty.MUDAH,
      points: 10,
      options: {
        create: [
          { content: 'Benar', isCorrect: true, order: 1 },
          { content: 'Salah', isCorrect: false, order: 2 },
        ],
      },
    },
  });

  // Question 3: MULTIPLE_RESPONSE
  const q3 = await prisma.question.create({
    data: {
      questionBankId: questionBank.id,
      type: QuestionType.MULTIPLE_RESPONSE,
      content: 'Manakah dari pernyataan berikut yang benar mengenai matriks persegi? (Pilih semua yang benar)',
      difficulty: Difficulty.SEDANG,
      points: 20,
      options: {
        create: [
          { content: 'Memiliki jumlah baris dan kolom yang sama.', isCorrect: true, order: 1 },
          { content: 'Dapat dicari nilai determinannya.', isCorrect: true, order: 2 },
          { content: 'Selalu memiliki nilai invers.', isCorrect: false, order: 3 },
          { content: 'Merupakan matriks identitas jika semua elemen bernilai 0.', isCorrect: false, order: 4 },
        ],
      },
    },
  });

  // Question 4: ESSAY
  const q4 = await prisma.question.create({
    data: {
      questionBankId: questionBank.id,
      type: QuestionType.ESSAY,
      content: 'Jelaskan langkah-langkah menyelesaikan Sistem Persamaan Linear Dua Variabel (SPLDV) menggunakan metode eliminasi dan substitusi.',
      difficulty: Difficulty.SULIT,
      points: 30,
    },
  });

  console.log('Questions created.');

  // 8. Create Exam
  const now = new Date();
  const startTime = new Date(now.getTime() - 10 * 60 * 1000); // Started 10 mins ago
  const endTime = new Date(now.getTime() + 120 * 60 * 1000); // Ends in 2 hours

  const exam = await prisma.exam.create({
    data: {
      title: 'Ujian Tengah Semester - Aljabar',
      description: 'Kerjakan soal-soal berikut dengan jujur. Sistem menggunakan pengawasan penuh (proctoring).',
      subjectId: mathSubject.id,
      teacherId: teacher.id,
      startTime: startTime,
      endTime: endTime,
      duration: 90, // 90 minutes
      status: ExamStatus.PUBLISHED,
      passingGrade: 70,
      examQuestions: {
        create: [
          { questionId: q1.id, order: 1 },
          { questionId: q2.id, order: 2 },
          { questionId: q3.id, order: 3 },
          { questionId: q4.id, order: 4 },
        ],
      },
    },
  });

  console.log('Exam created.');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
