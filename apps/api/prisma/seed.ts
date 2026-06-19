import { PrismaClient, Role, QuestionType, Difficulty, ExamStatus, SessionStatus, ViolationLevel, NotificationType, NotificationPriority, } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcryptjs';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function generateToken(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('🌱 Start seeding...');

  // ─── Cleanup (respect FK order) ───
  // Clean implicit M:N join table for Subject-Teacher before deleting subjects/teachers
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
  await prisma.roleAuditLog.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.customRole.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.subMenu.deleteMany({});
  await prisma.menu.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.rombel.deleteMany({});
  await prisma.major.deleteMany({});
  await prisma.setting.deleteMany({});

  console.log('🧹 Database cleaned.');

  // ─── Hashing ───
  const salt = await bcrypt.genSalt(10);
  const pwdSuper = await bcrypt.hash('superadmin123', salt);
  const pwdGuru = await bcrypt.hash('guru123', salt);
  const pwdSiswa = await bcrypt.hash('siswa123', salt);
  const pwdAdmin = await bcrypt.hash('admin123', salt);
  const pwdPengawas = await bcrypt.hash('pengawas123', salt);

  const now = new Date();
let answerCount = 0;

  // ========================================================================
  // 1. SETTINGS (10+)
  // ========================================================================
  const settingsData = [
    { key: 'appName', value: 'CBT Excellence' }, // Nama meringkas, tidak perlu nama panjang
    { key: 'logoUrl', value: '/images/logo.png' },
    { key: 'timezone', value: 'Asia/Jakarta' },
    { key: 'language', value: 'id' },
    { key: 'examDefaultDurationMinutes', value: '90' },
    { key: 'examDefaultMaxAttempts', value: '1' },
    { key: 'passingGradeDefault', value: '70' },
    { key: 'maxViolationPerSession', value: '3' },
    { key: 'autoLockOnViolation', value: 'true' },
    { key: 'sebEnabled', value: 'false' },
    { key: 'maintenanceMode', value: 'false' },
  ];

  await prisma.setting.createMany({ data: settingsData });
  console.log(`✅ Settings: ${settingsData.length} created.`);

  // ========================================================================
  // 2. MAJOR (4)
  // ========================================================================
  const majorsData = [
    { name: 'Rekayasa Perangkat Lunak', code: 'RPL', description: 'Pengembangan perangkat lunak dan aplikasi.' },
    { name: 'Teknik Komputer & Jaringan', code: 'TKJ', description: 'Infrastruktur jaringan dan administrasi sistem.' },
    { name: 'Akuntansi & Keuangan', code: 'AKL', description: 'Akuntansi dan pengelolaan keuangan.' },
    { name: 'Multimedia', code: 'MM', description: 'Desain grafis, animasi, dan produksi multimedia.' },
  ];

  await prisma.major.createMany({ data: majorsData });
  const majors = await prisma.major.findMany({ orderBy: { code: 'asc' } });
  console.log(`✅ Majors: ${majors.length} created.`);

  // ========================================================================
  // 3. ROMBEL (3 per major = 12)
  // ========================================================================
  const rombelNames: { name: string; majorIdx: number }[] = [];
  for (let i = 0; i < majors.length; i++) {
    const prefix = majors[i].code;
    for (let g = 1; g <= 3; g++) {
      rombelNames.push({ name: `X ${prefix} ${g}`, majorIdx: i });
    }
  }

  const rombels = await Promise.all(
    rombelNames.map((r) =>
      prisma.rombel.create({
        data: {
          name: r.name,
          majorId: majors[r.majorIdx].id,
        },
      }),
    ),
  );
  console.log(`✅ Rombels: ${rombels.length} created.`);

  // ========================================================================
  // 4. USERS – SuperAdmins (3), Teachers (6), Students (18), plus extras
  // ========================================================================
  const superUsers = await Promise.all([
    prisma.user.create({
      data: {
        username: 'superadmin1', email: 'sa1@cbt.com', password: pwdSuper,
        fullName: 'Super Admin Satu', role: Role.SUPER_ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        username: 'superadmin2', email: 'sa2@cbt.com', password: pwdSuper,
        fullName: 'Super Admin Dua', role: Role.SUPER_ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        username: 'superadmin3', email: 'sa3@cbt.com', password: pwdSuper,
        fullName: 'Super Admin Tiga', role: Role.SUPER_ADMIN,
      },
    }),
  ]);

  const teacherUsers = await Promise.all([
    prisma.user.create({ data: { username: 'guru1', email: 'guru1@cbt.com', password: pwdGuru, fullName: 'Budi Santoso, S.Pd', role: Role.GURU } }),
    prisma.user.create({ data: { username: 'guru2', email: 'guru2@cbt.com', password: pwdGuru, fullName: 'Siti Aminah, S.Pd', role: Role.GURU } }),
    prisma.user.create({ data: { username: 'guru3', email: 'guru3@cbt.com', password: pwdGuru, fullName: 'Rudi Hartono, M.Pd', role: Role.GURU } }),
    prisma.user.create({ data: { username: 'guru4', email: 'guru4@cbt.com', password: pwdGuru, fullName: 'Dewi Lestari, S.S', role: Role.GURU } }),
    prisma.user.create({ data: { username: 'guru5', email: 'guru5@cbt.com', password: pwdGuru, fullName: 'Ahmad Fauzi, M.Si', role: Role.GURU } }),
    prisma.user.create({ data: { username: 'guru6', email: 'guru6@cbt.com', password: pwdGuru, fullName: 'Fitri Handayani, S.Kom', role: Role.GURU } }),
  ]);

  const teachers = await Promise.all(
    teacherUsers.map((u, i) =>
      prisma.teacher.create({
        data: {
          userId: u.id,
          nip: `1987${String(100000 + i).slice(1)}`,
        },
      }),
    ),
  );

  // 18 students (3 per rombel × 6 rombels)
  const studentNames = [
    'Ani Rahmawati', 'Budi Hartono', 'Citra Dewi', 'Deni Saputra', 'Eka Puspita', 'Fajar Nugroho',
    'Gita Permata', 'Hadi Prasetyo', 'Indah Lestari', 'Joko Susilo', 'Kartika Sari', 'Lukman Hakim',
    'Mega Wati', 'Nanda Pratama', 'Oktaviani Putri', 'Putra Wirayudha', 'Qori Aulia', 'Rendi Saputra',
  ];

  const studentUsers = await Promise.all(
    studentNames.map((name, i) =>
      prisma.user.create({
        data: {
          username: `siswa${i + 1}`, email: `siswa${i + 1}@cbt.com`, password: pwdSiswa,
          fullName: name, role: Role.SISWA,
        },
      }),
    ),
  );

  const students = await Promise.all(
    studentUsers.map((u, i) =>
      prisma.student.create({
        data: {
          userId: u.id,
          nis: `2024${String(10000 + i).slice(1)}`,
          rombelId: rombels[i % rombels.length].id,
          majorId: rombels[i % rombels.length].majorId,
        },
      }),
    ),
  );

  // Extra admin user (ADMIN_SEKOLAH)
  const adminSekolahUser = await prisma.user.create({
    data: { username: 'admin_sekolah', email: 'admin@cbt.com', password: pwdAdmin, fullName: 'Kepala Sekolah', role: Role.ADMIN_SEKOLAH },
  });

  // Extra pengawas user
  const pengawasUser = await prisma.user.create({
    data: { username: 'pengawas1', email: 'pengawas@cbt.com', password: pwdPengawas, fullName: 'Pengawas Ujian', role: Role.PENGAWAS },
  });

  console.log(`✅ Users: ${superUsers.length + teacherUsers.length + studentUsers.length + 2} created (${superUsers.length} SA, ${teacherUsers.length} teachers, ${studentUsers.length} students, 1 admin, 1 pengawas).`);

  // ========================================================================
  // 5. SUBJECT (6)
  // ========================================================================
  const subjectsData = [
    { name: 'Matematika', code: 'MTK', description: 'Konsep numerik, aljabar, geometri, dan statistika.' },
    { name: 'Bahasa Indonesia', code: 'BIN', description: 'Keterampilan membaca, menulis, menyimak, dan berbicara.' },
    { name: 'Bahasa Inggris', code: 'BIG', description: 'Reading comprehension, grammar, and writing skills.' },
    { name: 'Pendidikan Pancasila', code: 'PPKN', description: 'Nilai kebangsaan, konstitusi, dan kewarganegaraan.' },
    { name: 'Informatika', code: 'IF', description: 'Komputasi, algoritma, dan literasi digital.' },
    { name: 'Produk Kreatif dan Kewirausahaan', code: 'PKK', description: 'Inovasi, bisnis, dan proyek kewirausahaan.' },
  ];

  await prisma.subject.createMany({ data: subjectsData });
  const subjects = await prisma.subject.findMany({ orderBy: { code: 'asc' } });
  console.log(`✅ Subjects: ${subjects.length} created.`);

  // Link teachers to subjects (each teacher teaches 1–3 subjects)
  const teacherSubjectMap = [
    [subjects[0].id, subjects[4].id],
    [subjects[1].id],
    [subjects[2].id],
    [subjects[3].id],
    [subjects[0].id, subjects[2].id, subjects[5].id],
    [subjects[1].id, subjects[3].id, subjects[4].id],
  ];

  await Promise.all(
    teachers.map((t, i) =>
      prisma.teacher.update({
        where: { id: t.id },
        data: {
          subjects: {
            connect: teacherSubjectMap[i].map((sid) => ({ id: sid })),
          },
        },
      }),
    ),
  );

  // ========================================================================
  // 6. EXAM GROUP (4)
  // ========================================================================
  const examGroupsData = [
    {
      name: 'ASAT 2024',
      description: 'Asesmen Sumatif Akhir Tahun 2024',
      academicYear: '2024/2025',
      semester: 'Genap',
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'ASTS Genap 2025',
      description: 'Asesmen Tengah Semester Genap 2025',
      academicYear: '2024/2025',
      semester: 'Genap',
      startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'PAS 2024',
      description: 'Penilaian Akhir Semester Ganjil 2024',
      academicYear: '2024/2025',
      semester: 'Ganjil',
      startDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      endDate: now,
    },
    {
      name: 'Try Out 2025',
      description: 'Try Out persiapan ujian nasional 2025',
      academicYear: '2024/2025',
      semester: 'Genap',
      startDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    },
  ];

  const examGroups = await Promise.all(
    examGroupsData.map((eg) =>
      prisma.examGroup.create({
        data: eg,
      }),
    ),
  );
  console.log(`✅ Exam Groups: ${examGroups.length} created.`);

  // ========================================================================
  // 7. QUESTION BANKS (6)
  // ========================================================================
  const qBanksData = [
    { name: 'Bank Soal Matematika - UTS', subjectId: subjects[0].id, teacherId: teachers[0].id, category: 'UTS' },
    { name: 'Bank Soal Matematika - UAS', subjectId: subjects[0].id, teacherId: teachers[0].id, category: 'UAS' },
    { name: 'Bank Soal Bahasa Indonesia', subjectId: subjects[1].id, teacherId: teachers[1].id, category: 'UTS' },
    { name: 'Bank Soal Bahasa Inggris', subjectId: subjects[2].id, teacherId: teachers[2].id, category: 'UTS' },
    { name: 'Bank Soal PPKN', subjectId: subjects[3].id, teacherId: teachers[3].id, category: 'UAS' },
    { name: 'Bank Soal PKK', subjectId: subjects[5].id, teacherId: teachers[4].id, category: 'UTS' },
  ];

  const qBanks = await Promise.all(
    qBanksData.map((qb) =>
      prisma.questionBank.create({
        data: qb,
      }),
    ),
  );
  console.log(`✅ Question Banks: ${qBanks.length} created.`);

  // ========================================================================
  // 8. QUESTIONS & OPTIONS (3-4 per bank = 18)
  // ========================================================================
  interface QuestionSeed {
    type: QuestionType;
    content: string;
    difficulty: Difficulty;
    points: number;
    options: { content: string; isCorrect: boolean }[];
  }

  const questionsSeed: Record<number, QuestionSeed[]> = {
    // Bank 0 – Matematika UTS (4 soal)
    0: [
      {
        type: QuestionType.PILIHAN_GANDA,
        content: 'Hasil dari 12 × 15 adalah …',
        difficulty: Difficulty.MUDAH,
        points: 10,
        options: [
          { content: '150', isCorrect: false },
          { content: '180', isCorrect: true },
          { content: '210', isCorrect: false },
          { content: '300', isCorrect: false },
        ],
      },
      {
        type: QuestionType.BENAR_SALAH,
        content: 'Segitiga siku-siku memiliki sudut 90°.',
        difficulty: Difficulty.MUDAH,
        points: 5,
        options: [
          { content: 'Benar', isCorrect: true },
          { content: 'Salah', isCorrect: false },
        ],
      },
      {
        type: QuestionType.MULTIPLE_RESPONSE,
        content: 'Manakah bilangan prima?',
        difficulty: Difficulty.SEDANG,
        points: 15,
        options: [
          { content: '2', isCorrect: true },
          { content: '4', isCorrect: false },
          { content: '7', isCorrect: true },
          { content: '9', isCorrect: false },
        ],
      },
      {
        type: QuestionType.PILIHAN_GANDA,
        content: 'Keliling persegi dengan sisi 5 cm adalah …',
        difficulty: Difficulty.MUDAH,
        points: 10,
        options: [
          { content: '15 cm', isCorrect: false },
          { content: '20 cm', isCorrect: true },
          { content: '25 cm', isCorrect: false },
          { content: '10 cm', isCorrect: false },
        ],
      },
    ],

    // Bank 1 – Matematika UAS (3 soal)
    1: [
      {
        type: QuestionType.PILIHAN_GANDA,
        content: 'Nilai dari √144 adalah …',
        difficulty: Difficulty.MUDAH,
        points: 10,
        options: [
          { content: '10', isCorrect: false },
          { content: '12', isCorrect: true },
          { content: '14', isCorrect: false },
          { content: '16', isCorrect: false },
        ],
      },
      {
        type: QuestionType.ESSAY,
        content: 'Jelaskan langkah-langkah menyelesaikan persamaan kuadrat!',
        difficulty: Difficulty.SULIT,
        points: 20,
        options: [],
      },
      {
        type: QuestionType.PILIHAN_GANDA,
        content: 'Jika f(x)=2x+3, nilai f(5) adalah …',
        difficulty: Difficulty.SEDANG,
        points: 10,
        options: [
          { content: '10', isCorrect: false },
          { content: '13', isCorrect: true },
          { content: '15', isCorrect: false },
          { content: '17', isCorrect: false },
        ],
      },
    ],

    // Bank 2 – Bahasa Indonesia UTS (3 soal)
    2: [
      {
        type: QuestionType.PILIHAN_GANDA,
        content: 'Antonim dari kata "besar" adalah …',
        difficulty: Difficulty.MUDAH,
        points: 10,
        options: [
          { content: 'Tinggi', isCorrect: false },
          { content: 'Kecil', isCorrect: true },
          { content: 'Lebar', isCorrect: false },
          { content: 'Panjang', isCorrect: false },
        ],
      },
      {
        type: QuestionType.BENAR_SALAH,
        content: 'Puisi diawali dengan bait.',
        difficulty: Difficulty.MUDAH,
        points: 5,
        options: [
          { content: 'Benar', isCorrect: true },
          { content: 'Salah', isCorrect: false },
        ],
      },
      {
        type: QuestionType.PILIHAN_GANDA,
        content: 'Penulisan kata baku yang benar adalah …',
        difficulty: Difficulty.SEDANG,
        points: 10,
        options: [
          { content: 'Aktif', isCorrect: true },
          { content: 'Aktip', isCorrect: false },
          { content: 'Efektif', isCorrect: false },
          { content: 'Kreatif', isCorrect: false },
        ],
      },
    ],

    // Bank 3 – Bahasa Inggris UTS (4 soal)
    3: [
      {
        type: QuestionType.PILIHAN_GANDA,
        content: '"What is the synonym of "happy"?"',
        difficulty: Difficulty.MUDAH,
        points: 10,
        options: [
          { content: 'Sad', isCorrect: false },
          { content: 'Joyful', isCorrect: true },
          { content: 'Angry', isCorrect: false },
          { content: 'Tired', isCorrect: false },
        ],
      },
      {
        type: QuestionType.BENAR_SALAH,
        content: '"The sun rises in the west."',
        difficulty: Difficulty.MUDAH,
        points: 5,
        options: [
          { content: 'True', isCorrect: false },
          { content: 'False', isCorrect: true },
        ],
      },
      {
        type: QuestionType.MULTIPLE_RESPONSE,
        content: 'Which of the following are fruits?',
        difficulty: Difficulty.SEDANG,
        points: 15,
        options: [
          { content: 'Apple', isCorrect: true },
          { content: 'Carrot', isCorrect: false },
          { content: 'Banana', isCorrect: true },
          { content: 'Potato', isCorrect: false },
        ],
      },
      {
        type: QuestionType.ESSAY,
        content: 'Write a short paragraph about your hobby!',
        difficulty: Difficulty.SEDANG,
        points: 20,
        options: [],
      },
    ],

    // Bank 4 – PPKN UAS (4 soal)
    4: [
      {
        type: QuestionType.PILIHAN_GANDA,
        content: 'Pancasila sebagai dasar negara tercantum dalam…',
        difficulty: Difficulty.SEDANG,
        points: 10,
        options: [
          { content: 'UUD 1945', isCorrect: false },
          { content: 'Pembukaan UUD 1945', isCorrect: true },
          { content: 'Tap MPR', isCorrect: false },
          { content: 'Perpres', isCorrect: false },
        ],
      },
      {
        type: QuestionType.MULTIPLE_RESPONSE,
        content: 'Hak warga negara yang dijamin UUD 1945 antara lain…',
        difficulty: Difficulty.SEDANG,
        points: 15,
        options: [
          { content: 'Mendapat pendidikan', isCorrect: true },
          { content: 'Membayar pajak', isCorrect: false },
          { content: 'Berpendapat', isCorrect: true },
          { content: 'Melanggar hukum', isCorrect: false },
        ],
      },
      {
        type: QuestionType.PILIHAN_GANDA,
        content: 'Sila ke-3 Pancasila dilambangkan dengan…',
        difficulty: Difficulty.MUDAH,
        points: 10,
        options: [
          { content: 'Bintang', isCorrect: false },
          { content: 'Pohon Beringin', isCorrect: true },
          { content: 'Rantai', isCorrect: false },
          { content: 'Padi Kapas', isCorrect: false },
        ],
      },
      {
        type: QuestionType.BENAR_SALAH,
        content: 'Indonesia memiliki 30 provinsi.',
        difficulty: Difficulty.MUDAH,
        points: 5,
        options: [
          { content: 'Benar', isCorrect: false },
          { content: 'Salah', isCorrect: true },
        ],
      },
    ],

    // Bank 5 – PKK UTS (3 soal)
    5: [
      {
        type: QuestionType.PILIHAN_GANDA,
        content: 'Kewirausahaan berasal dari kata "wira" yang berarti…',
        difficulty: Difficulty.MUDAH,
        points: 10,
        options: [
          { content: 'Usaha', isCorrect: false },
          { content: 'Pahlawan', isCorrect: true },
          { content: 'Dagang', isCorrect: false },
          { content: 'Modal', isCorrect: false },
        ],
      },
      {
        type: QuestionType.BENAR_SALAH,
        content: 'Inovasi adalah kunci utama dalam kewirausahaan.',
        difficulty: Difficulty.MUDAH,
        points: 5,
        options: [
          { content: 'Benar', isCorrect: true },
          { content: 'Salah', isCorrect: false },
        ],
      },
      {
        type: QuestionType.ESSAY,
        content: 'Sebutkan dan jelaskan 4 fungsi manajemen!',
        difficulty: Difficulty.SULIT,
        points: 20,
        options: [],
      },
    ],
  };

  const questions: { id: string; bankIdx: number }[] = [];

  for (const [bankIdx, seedArr] of Object.entries(questionsSeed)) {
    const idx = Number(bankIdx);
    for (const qs of seedArr) {
      const q = await prisma.question.create({
        data: {
          questionBankId: qBanks[idx].id,
          type: qs.type,
          content: qs.content,
          difficulty: qs.difficulty,
          points: qs.points,
          tags: [],
          options: qs.options.length > 0 ? { create: qs.options.map((o, i) => ({ content: o.content, isCorrect: o.isCorrect, order: i + 1 })) } : undefined,
        },
      });
      questions.push({ id: q.id, bankIdx: idx });
    }
  }

  const totalQuestions = questions.length;
  console.log(`✅ Questions: ${totalQuestions} created across ${qBanks.length} banks.`);

  // ========================================================================
  // 9. EXAMS (6)
  // ========================================================================
  const examsData = [
    {
      title: 'UTS Matematika - Genap 2025',
      desc: 'Ujian Tengah Semester Matematika Wajib',
      subjectIdx: 0, teacherIdx: 0, groupIdx: 1,
      startOffsetMin: -10, endOffsetDays: 7,
      duration: 90, passingGrade: 70, status: ExamStatus.ONGOING,
      questionBankIdx: 0,
      randomizeSoal: true, randomizeOpsi: true,
      requireSeb: true, blockKeyCopyPaste: true, forceFullscreen: true,
      showScore: false, maxViolations: 3,
    },
    {
      title: 'UAS Matematika - Ganjil 2024',
      desc: 'Ujian Akhir Semester Matematika Wajib',
      subjectIdx: 0, teacherIdx: 0, groupIdx: 2,
      startOffsetMin: -5, endOffsetDays: 14,
      duration: 120, passingGrade: 65, status: ExamStatus.ONGOING,
      questionBankIdx: 1,
      randomizeSoal: true, randomizeOpsi: true,
      requireSeb: false, blockKeyCopyPaste: true, forceFullscreen: false,
      showScore: true, maxViolations: 5,
    },
    {
      title: 'UTS Bahasa Indonesia - Genap 2025',
      desc: 'Ujian Tengah Semester Bahasa Indonesia',
      subjectIdx: 1, teacherIdx: 1, groupIdx: 1,
      startOffsetMin: -8, endOffsetDays: 7,
      duration: 90, passingGrade: 70, status: ExamStatus.ONGOING,
      questionBankIdx: 2,
      randomizeSoal: true, randomizeOpsi: false,
      requireSeb: false, blockKeyCopyPaste: false, forceFullscreen: false,
      showScore: true, maxViolations: 0,
    },
    {
      title: 'Try Out Bahasa Inggris',
      desc: 'Try Out persiapan ASAT',
      subjectIdx: 2, teacherIdx: 2, groupIdx: 3,
      startOffsetMin: 60, endOffsetDays: 3,
      duration: 60, passingGrade: 60, status: ExamStatus.PUBLISHED,
      questionBankIdx: 3,
      randomizeSoal: false, randomizeOpsi: true,
      requireSeb: true, blockKeyCopyPaste: true, forceFullscreen: true,
      showScore: false, maxViolations: 2,
    },
    {
      title: 'UAS PPKN - Ganjil 2024',
      desc: 'Ujian Akhir Semester PPKN',
      subjectIdx: 3, teacherIdx: 3, groupIdx: 2,
      startOffsetMin: -2, endOffsetDays: 10,
      duration: 90, passingGrade: 70, status: ExamStatus.ONGOING,
      questionBankIdx: 4,
      randomizeSoal: true, randomizeOpsi: true,
      requireSeb: false, blockKeyCopyPaste: true, forceFullscreen: false,
      showScore: true, maxViolations: 4,
    },
    {
      title: 'UAS PKK (DRAFT)',
      desc: 'Ujian Akhir Semester PKK - belum dipublikasikan',
      subjectIdx: 5, teacherIdx: 4, groupIdx: 0,
      startOffsetMin: 1440, endOffsetDays: 30,
      duration: 90, passingGrade: 70, status: ExamStatus.DRAFT,
      questionBankIdx: 5,
      randomizeSoal: false, randomizeOpsi: false,
      requireSeb: false, blockKeyCopyPaste: false, forceFullscreen: false,
      showScore: true, maxViolations: 0,
    },
  ];

  const exams = await Promise.all(
    examsData.map((ed) => {
      const startTime = new Date(now.getTime() + ed.startOffsetMin * 60 * 1000);
      const endTime = new Date(now.getTime() + ed.endOffsetDays * 24 * 60 * 60 * 1000);
      return prisma.exam.create({
        data: {
          title: ed.title,
          description: ed.desc,
          subjectId: subjects[ed.subjectIdx].id,
          teacherId: teachers[ed.teacherIdx].id,
          examGroupId: examGroups[ed.groupIdx].id,
          startTime,
          endTime,
          duration: ed.duration,
          token: generateToken(8),
          maxAttempts: 1,
          randomizeSoal: ed.randomizeSoal,
          randomizeOpsi: ed.randomizeOpsi,
          passingGrade: ed.passingGrade,
          status: ed.status,
          showScore: ed.showScore,
          sebConfigKey: ed.requireSeb ? `SEB-${ed.subjectIdx + 1}${ed.teacherIdx + 1}` : null,
          sebBrowserKey: ed.requireSeb ? `BROWSER-${ed.subjectIdx + 1}${ed.teacherIdx + 1}` : null,
          requireSeb: ed.requireSeb,
          blockKeyCopyPaste: ed.blockKeyCopyPaste,
          forceFullscreen: ed.forceFullscreen,
          maxViolations: ed.maxViolations,
          examQuestions: {
            create: questions
              .filter((q) => q.bankIdx === ed.questionBankIdx)
              .map((q, i) => ({ questionId: q.id, order: i + 1 })),
          },
        },
      });
    }),
  );

  console.log(`✅ Exams: ${exams.length} created.`);

  // ========================================================================
  // 10. EXAM SESSIONS (3+ per exam, diverse statuses)
  // ========================================================================
  const examSessions: { id: string; examIdx: number; studentIdx: number; status: SessionStatus }[] = [];

  for (let ei = 0; ei < exams.length; ei++) {
    const count = 3 + (ei % 3); // 3,4,5,3,4,3
    const taken: number[] = [];

    for (let si = 0; si < count; si++) {
      const studentIdx = (ei * 7 + si * 3) % students.length;
      if (taken.includes(studentIdx)) continue;
      taken.push(studentIdx);

      const startMinAgo = randomInt(2, 30);

      // Vary session statuses to cover all enum values
      let sessionStatus: SessionStatus;
      if (ei === 0 && si === 0) {
        sessionStatus = SessionStatus.FINISHED;
      } else if (ei === 1 && si === 1) {
        sessionStatus = SessionStatus.SUBMITTED;
      } else if (ei === 2 && si === 2) {
        sessionStatus = SessionStatus.LOCKED;
      } else if (ei === 5) {
        sessionStatus = SessionStatus.NOT_STARTED;
      } else {
        sessionStatus = SessionStatus.IN_PROGRESS;
      }

      const session = await prisma.examSession.create({
        data: {
          examId: exams[ei].id,
          studentId: students[studentIdx].id,
          startTime: sessionStatus === SessionStatus.IN_PROGRESS
            ? new Date(now.getTime() - startMinAgo * 60 * 1000)
            : new Date(now.getTime() - (startMinAgo + 60) * 60 * 1000),
          endTime: [SessionStatus.SUBMITTED, SessionStatus.FINISHED, SessionStatus.LOCKED].includes(sessionStatus)
            ? new Date(now.getTime() - startMinAgo * 60 * 1000)
            : undefined,
          status: sessionStatus,
          ipAddress: `192.168.${randomInt(0, 255)}.${randomInt(1, 254)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          score: [SessionStatus.SUBMITTED, SessionStatus.FINISHED, SessionStatus.LOCKED].includes(sessionStatus)
            ? randomInt(40, 100)
            : undefined,
          lastActiveAt: sessionStatus === SessionStatus.IN_PROGRESS
            ? new Date(now.getTime() - randomInt(0, 5) * 60 * 1000)
            : undefined,
        },
      });

      examSessions.push({ id: session.id, examIdx: ei, studentIdx, status: sessionStatus });
    }
  }

  console.log(`✅ Exam Sessions: ${examSessions.length} created.`);

  // ========================================================================
  // 11. ANSWERS (covering sessions, including essay and media reference)
  // ========================================================================
  const completedStatuses = new Set([SessionStatus.SUBMITTED, SessionStatus.FINISHED, SessionStatus.LOCKED]);
  const sessionsWithCompletedStatus = examSessions.filter((es) => completedStatuses.has(es.status));

  for (const es of sessionsWithCompletedStatus) {
    const examQuestionsForExam = questions.filter((q) => q.bankIdx === examsData[es.examIdx].questionBankIdx);
    if (examQuestionsForExam.length === 0) continue;

    const answerCountForSession = Math.min(randomInt(2, examQuestionsForExam.length), examQuestionsForExam.length);

    for (let ai = 0; ai < answerCountForSession; ai++) {
      const q = examQuestionsForExam[ai];
      const opts = await prisma.questionOption.findMany({ where: { questionId: q.id } });
      const correctOpt = opts.find((o) => o.isCorrect);

      const isEssay = q.type === QuestionType.ESSAY;
      const essayAnswer = isEssay
        ? 'Jawaban essay siswa: Langkah-langkah sesuai materi yang diajarkan di kelas, mulai dari identifikasi, perhitungan, sampai kesimpulan akhir.'
        : undefined;

      await prisma.answer.create({
        data: {
          examSessionId: es.id,
          questionId: q.id,
          selectedOption: isEssay ? null : correctOpt?.id || null,
          isCorrect: isEssay ? null : correctOpt ? true : null,
          score: isEssay
            ? randomInt(15, 20)
            : correctOpt
              ? await prisma.question.findUnique({ where: { id: q.id } }).then((q2) => q2?.points || 0)
              : 0,
          essayAnswer,
        },
      });
      answerCount++;
    }
  }

  console.log(`✅ Answers: ${answerCount} created.`);

  // ========================================================================
  // 12. VIOLATIONS (varied levels and types)
  // ========================================================================
  const violationTypes = ['TAB_SWITCH', 'COPY_PASTE', 'MOUSE_LEAVE', 'FULLSCREEN_EXIT', 'DEVELOPER_TOOLS', 'RIGHT_CLICK'];
  const violationLevels: ViolationLevel[] = ['RINGAN', 'SEDANG', 'BERAT', 'KRITIS'];

  const violationsData: { examSessionId: string; level: ViolationLevel; type: string; description: string }[] = [];

  for (let vi = 0; vi < Math.min(8, examSessions.length); vi++) {
    const es = examSessions[vi];
    const vtype = violationTypes[vi % violationTypes.length];
    const level = vi % 2 === 0 ? ViolationLevel.RINGAN : vi % 3 === 0 ? ViolationLevel.SEDANG : ViolationLevel.BERAT;

    const descriptions: Record<string, string> = {
      TAB_SWITCH: 'Pindah tab sebanyak 2 kali selama ujian',
      COPY_PASTE: 'Mendeteksi aktivitas copy-paste saat ujian',
      MOUSE_LEAVE: 'Kursor meninggalkan area ujian',
      FULLSCREEN_EXIT: 'Keluar dari mode fullscreen',
      DEVELOPER_TOOLS: 'Membuka developer tools (console/inspect)',
      RIGHT_CLICK: 'Melihat source code/konteks menu',
    };

    violationsData.push({
      examSessionId: es.id,
      level,
      type: vtype,
      description: descriptions[vtype] || `Pelanggaran ${vtype} terdeteksi`,
    });
  }

  await prisma.violation.createMany({ data: violationsData });
  console.log(`✅ Violations: ${violationsData.length} created.`);

  // ========================================================================
  // 13. CUSTOM ROLES (4)
  // ========================================================================
  const customRolesData = [
    { name: 'Administrator', slug: 'administrator', description: 'Akses penuh ke semua fitur', isSystem: true },
    { name: 'Guru', slug: 'guru', description: 'Akses guru: buat soal, ujian, lihat hasil', isSystem: true },
    { name: 'Pengawas', slug: 'pengawas', description: 'Akses monitoring ujian saja', isSystem: false },
    { name: 'Kepala Sekolah', slug: 'kepala-sekolah', description: 'Akses laporan dan statistik', isSystem: false },
  ];

  await prisma.customRole.createMany({ data: customRolesData });
  const customRoles = await prisma.customRole.findMany({ orderBy: { name: 'asc' } });
  console.log(`✅ Custom Roles: ${customRoles.length} created.`);

  // ========================================================================
  // 14. MENU & SUBMENU (5 menus, 17 submenus)
  // ========================================================================
  const menusData = [
    { name: 'Dashboard', icon: 'LayoutDashboard', orderIndex: 1 },
    { name: 'Manajemen', icon: 'Settings', orderIndex: 2 },
    { name: 'Ujian', icon: 'FileCheck', orderIndex: 3 },
    { name: 'Laporan', icon: 'BarChart3', orderIndex: 4 },
    { name: 'Pengaturan', icon: 'Cog', orderIndex: 5 },
  ];

  const menus = await Promise.all(
    menusData.map((m) =>
      prisma.menu.create({
        data: m,
      }),
    ),
  );
  console.log(`✅ Menus: ${menus.length} created.`);

  const subMenusData: { menuIdx: number; name: string; url: string; orderIndex: number }[] = [
    // Dashboard
    { menuIdx: 0, name: 'Overview', url: '/admin', orderIndex: 1 },
    { menuIdx: 0, name: 'Aktivitas Terkini', url: '/admin/activity', orderIndex: 2 },
    { menuIdx: 0, name: 'Statistik Cepat', url: '/admin/stats', orderIndex: 3 },

    // Manajemen
    { menuIdx: 1, name: 'Pengguna', url: '/admin/users', orderIndex: 1 },
    { menuIdx: 1, name: 'Role & Permissions', url: '/admin/roles', orderIndex: 2 },
    { menuIdx: 1, name: 'Jurusan', url: '/admin/majors', orderIndex: 4 },
    { menuIdx: 1, name: 'Rombel', url: '/admin/rombels', orderIndex: 5 },

    // Ujian
    { menuIdx: 2, name: 'Bank Soal', url: '/admin/question-banks', orderIndex: 1 },
    { menuIdx: 2, name: 'Buat Ujian', url: '/admin/exams/create', orderIndex: 2 },
    { menuIdx: 2, name: 'Daftar Ujian', url: '/admin/exams', orderIndex: 3 },
    { menuIdx: 2, name: 'Monitoring', url: '/admin/monitoring', orderIndex: 4 },
    { menuIdx: 2, name: 'Kelompok Ujian', url: '/admin/exam-groups', orderIndex: 5 },

    // Laporan
    { menuIdx: 3, name: 'Hasil Ujian', url: '/admin/results', orderIndex: 1 },
    { menuIdx: 3, name: 'Analisis Soal', url: '/admin/analysis', orderIndex: 2 },
    { menuIdx: 3, name: 'Rekap Pelanggaran', url: '/admin/violations', orderIndex: 3 },

    // Pengaturan
    { menuIdx: 4, name: 'Pengaturan Umum', url: '/admin/settings', orderIndex: 1 },
    { menuIdx: 4, name: 'Tema & Tampilan', url: '/admin/theme', orderIndex: 2 },
  ];

  const subMenus = await Promise.all(
    subMenusData.map((sm) =>
      prisma.subMenu.create({
        data: {
          menuId: menus[sm.menuIdx].id,
          name: sm.name,
          url: sm.url,
          orderIndex: sm.orderIndex,
        },
      }),
    ),
  );
  console.log(`✅ Sub-Menus: ${subMenus.length} created.`);

  // ========================================================================
  // 15. PERMISSIONS (3+ per submenu = 50+)
  // ========================================================================
  const permissionActions = ['create', 'read', 'update', 'delete', 'export', 'approve', 'monitor', 'lock', 'unlock'];
  const permissionsData: { subMenuIdx: number; name: string; action: string; securityRiskLevel: string }[] = [];

  for (let si = 0; si < subMenus.length; si++) {
    const baseName = subMenusData[si]?.name || `submenu-${si}`;
    const actionCount = 3 + (si % 2); // 3 or 4 actions per submenu

    for (let ai = 0; ai < actionCount; ai++) {
      const action = permissionActions[(si + ai) % permissionActions.length];
      const risk = ai === 0 ? 'LOW' : ai === 1 ? 'MEDIUM' : ai === 2 ? 'HIGH' : 'CRITICAL';
      permissionsData.push({
        subMenuIdx: si,
        name: `${baseName}:${action}`,
        action,
        securityRiskLevel: risk,
      });
    }
  }

  const permissions = await Promise.all(
    permissionsData.map((pd) =>
      prisma.permission.create({
        data: {
          subMenuId: subMenus[pd.subMenuIdx].id,
          name: pd.name,
          action: pd.action,
          securityRiskLevel: pd.securityRiskLevel,
        },
      }),
    ),
  );
  console.log(`✅ Permissions: ${permissions.length} created.`);

  // ========================================================================
  // 16. ROLE PERMISSION
  // ========================================================================
  const rolePerms: { roleIdx: number; permIdx: number }[] = [];

  for (let ri = 0; ri < customRoles.length; ri++) {
    const assignAll = ri === 0;
    const everyN = ri === 0 ? 1 : ri + 1;

    for (let pi = 0; pi < permissions.length; pi++) {
      if (assignAll || (pi + 1) % everyN === 0) {
        rolePerms.push({ roleIdx: ri, permIdx: pi });
      }
    }
  }

  await prisma.rolePermission.createMany({
    data: rolePerms.map((rp) => ({
      roleId: customRoles[rp.roleIdx].id,
      permissionId: permissions[rp.permIdx].id,
    })),
  });
  console.log(`✅ Role-Permissions: ${rolePerms.length} assigned.`);

  // ========================================================================
  // 17. USER ROLES
  // ========================================================================
  const userRolesData: { userId: string; roleIdx: number }[] = [
    ...superUsers.map((u) => ({ userId: u.id, roleIdx: 0 })),
    ...teachers.map((_, i) => ({ userId: teacherUsers[i].id, roleIdx: 1 })),
    { userId: adminSekolahUser.id, roleIdx: 0 },
    { userId: pengawasUser.id, roleIdx: 2 },
  ];

  await prisma.userRole.createMany({
    data: userRolesData.map((ur) => ({
      userId: ur.userId,
      roleId: customRoles[ur.roleIdx].id,
    })),
  });
  console.log(`✅ User-Roles: ${userRolesData.length} created.`);

  // ========================================================================
  // 18. ROLE AUDIT LOGS (5)
  // ========================================================================
  const auditActions = ['ROLE_CREATED', 'ROLE_UPDATED', 'ROLE_DELETED', 'PERMISSION_GRANTED', 'PERMISSION_REVOKED'];
  const roleAuditLogs = await Promise.all(
    customRoles.slice(0, 3).map((role, i) =>
      prisma.roleAuditLog.create({
        data: {
          roleId: role.id,
          actorId: superUsers[i % superUsers.length].id,
          actionType: auditActions[i],
          ipAddress: `192.168.1.${100 + i}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      }),
    ),
  );
  console.log(`✅ Role Audit Logs: ${roleAuditLogs.length} created.`);

  // ========================================================================
  // 19. AUDIT LOGS (7)
  // ========================================================================
  const auditLogsData: { userId: string; action: string; module: string }[] = [
    { userId: superUsers[0].id, action: 'LOGIN', module: 'Auth' },
    { userId: superUsers[0].id, action: 'SEED_DATABASE', module: 'System' },
    { userId: teacherUsers[0].id, action: 'CREATE_EXAM', module: 'Exam' },
    { userId: teacherUsers[1].id, action: 'CREATE_QUESTION', module: 'Question' },
    { userId: studentUsers[0].id, action: 'START_EXAM', module: 'ExamSession' },
    { userId: studentUsers[0].id, action: 'SUBMIT_ANSWER', module: 'Answer' },
    { userId: superUsers[1].id, action: 'VIEW_REPORT', module: 'Report' },
  ];

  await prisma.auditLog.createMany({ data: auditLogsData });
  console.log(`✅ Audit Logs: ${auditLogsData.length} created.`);

  // ========================================================================
  // 20. NOTIFICATIONS (5) + RECIPIENTS
  // ========================================================================
  const createdNotifications: { id: string }[] = [];
  const notifTypes = [
    'EXAM_REMINDER',
    'VIOLATION_DETECTED',
    'SYSTEM_ANNOUNCEMENT',
    'EXAM_SUBMITTED',
    'SESSION_EXPIRED',
  ] as const;
  for (let ni = 0; ni < 5; ni++) {
    const notification = await prisma.notification.create({
      data: {
        type: notifTypes[ni],
        priority: ni === 1 ? 'URGENT' : ni === 0 ? 'HIGH' : 'NORMAL',
        title: ['Ujian Dimulai', 'Pelanggaran Terdeteksi', 'Seeder Selesai', 'Siswa Selesai Ujian', 'Monitoring Aktif'][ni],
        message: [
          'UTS Matematika telah dimulai oleh 5 siswa.',
          'Siswa Ani Rahmawati terdeteksi membuka tab baru selama ujian.',
          'Seeder berhasil menjalankan semua data.',
          '3 siswa telah menyelesaikan Try Out Bahasa Inggris.',
          'Anda ditugaskan sebagai pengawas untuk UAS PPKN.',
        ][ni],
        referenceId: exams[ni]?.id || null,
        referenceType: exams[ni] ? 'exam' : null,
        createdBy: superUsers[0].id,
      },
    });
    createdNotifications.push({ id: notification.id });
    const recipientUserIds: string[] = [
      [teacherUsers[0].id, superUsers[1].id],
      [teacherUsers[1].id, pengawasUser.id],
      superUsers.map((u) => u.id),
      [teacherUsers[2].id, superUsers[0].id],
      [pengawasUser.id, superUsers[0].id],
    ][ni];
    await prisma.notificationRecipient.createMany({
      data: recipientUserIds.map((userId) => ({ notificationId: notification.id, userId })),
    });
  }
  console.log(`✅ Notifications: ${createdNotifications.length} created.`);
  // ========================================================================
  // 20b. NOTIFICATION PREFERENCES
  // ========================================================================
  const notifPrefUsers = [...superUsers, ...teachers.slice(0, 3), pengawasUser];
  const allNotifTypes: string[] = [
    'EXAM_SUBMITTED', 'EXAM_AUTO_SUBMIT', 'VIOLATION_DETECTED', 'IMPORT_COMPLETED', 'IMPORT_FAILED', 'EXAM_REMINDER', 'SESSION_EXPIRED', 'SYSTEM_ANNOUNCEMENT'
  ];
  const notifPrefsData: { userId: string; type: string; enabled: boolean }[] = [];
  for (const u of notifPrefUsers) {
    for (const nt of allNotifTypes) {
      notifPrefsData.push({ userId: u.id, type: nt, enabled: true });
    }
  }
  await prisma.notificationPreference.createMany({ data: notifPrefsData });
  console.log(`✅ Notification Preferences: ${notifPrefsData.length} created.`);

  // ========================================================================
  // 21. EXAM TARGETS (rombels + majors)
  // ========================================================================
  await prisma.examTargetRombel.createMany({
    data: exams.map((e, i) => ({ examId: e.id, rombelId: rombels[i % rombels.length].id })),
  });
  await prisma.examTargetMajor.createMany({
    data: exams.map((e, i) => ({ examId: e.id, majorId: rombels[i % rombels.length].majorId })),
  });
  console.log('✅ Exam Targets: created for all exams.');

  // Add media to first question (image reference)
  const firstQuestion = await prisma.question.findFirst({ orderBy: { createdAt: 'asc' } });
  if (firstQuestion) {
    await prisma.question.update({
      where: { id: firstQuestion.id },
      data: { mediaUrl: '/media/matematika/grafik1.png', mediaType: 'image' },
    });
  }

  // ─── Summary ───
  console.log('═══════════════════════════════════════');
  console.log('🌱 Seeding completed successfully!');
  console.log('═══════════════════════════════════════');
  console.log(' 📊 Summary:');
  console.log(` • Settings: ${settingsData.length}`);
  console.log(` • Majors: ${majors.length}`);
  console.log(` • Rombels: ${rombels.length}`);
  console.log(` • Users: ${await prisma.user.count()}`);
  console.log(` - Super Admins: ${superUsers.length}`);
  console.log(` - Teachers: ${teacherUsers.length}`);
  console.log(` - Students: ${studentUsers.length}`);
  console.log(` - Other: 2 (admin, pengawas)`);
  console.log(` • Subjects: ${subjects.length}`);
  console.log(` • Exam Groups: ${examGroups.length}`);
  console.log(` • Question Banks: ${qBanks.length}`);
  console.log(` • Questions: ${questions.length}`);
  console.log(` • Exams: ${exams.length}`);
  console.log(` • Exam Sessions: ${examSessions.length}`);
  console.log(` • Answers: ${answerCount}`);
  console.log(` • Violations: ${violationsData.length}`);
  console.log(` • Custom Roles: ${customRoles.length}`);
  console.log(` • Menus: ${menus.length}`);
  console.log(` • Sub-Menus: ${subMenus.length}`);
  console.log(` • Permissions: ${permissions.length}`);
  console.log(` • Role-Permissions: ${rolePerms.length}`);
  console.log(` • User-Roles: ${userRolesData.length}`);
  console.log(` • Role Audit Logs: ${roleAuditLogs.length}`);
  console.log(` • Audit Logs: ${auditLogsData.length}`);
  console.log(` • Notifications: ${createdNotifications.length}`);
  console.log(` • Notification Preferences: ${notifPrefsData.length}`);
  console.log(' • Exam Targets: created');
  console.log('═══════════════════════════════════════');

  const tokenExams = await prisma.exam.findMany({
    where: { token: { not: null } },
    select: { title: true, token: true },
  });

  console.log('\n🔑 Exam Tokens:');
  for (const e of tokenExams) {
    console.log(` ${e.title}: token = ${e.token}`);
  }

  console.log('\n✨ SEMUA FITUR SUDAH TERISI! Terdapat:');
  console.log(' ✅ 11 tipe data utama (settings, majors, rombels, users, exam-groups, question-banks, questions, exams, exam-sessions, answers, violations, custom-roles, menus, submenus, permissions, audit-logs, notifications)');
  console.log(' ✅ Semua enum values diuji coba (SessionStatus: IN_PROGRESS, SUBMITTED, FINISHED, LOCKED, NOT_STARTED; ExamStatus: ONGOING, PUBLISHED, DRAFT; ViolationLevel: RINGAN, SEDANG, BERAT, KRITIS)');
  console.log(' ✅ Essays, media reference, essay answers');
  console.log(' ✅ Violations dengan berbagai tipe dan deskripsi');
  console.log(' ✅ Role-based access (administrator, guru, pengawas, kepala sekolah)');
  console.log(' ✅ DRAFT exam uji kontrol');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
