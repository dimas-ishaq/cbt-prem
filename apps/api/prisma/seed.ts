import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient, Role, QuestionType, Difficulty, ExamStatus, SessionStatus, ViolationLevel, NotificationType, NotificationPriority } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcryptjs';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Helpers ───
function token(length = 6) {
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => c[Math.floor(Math.random() * c.length)]).join('');
}
function rnd(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function offsetDays(days: number) { return 24 * 60 * 60 * 1000 * days; }
function offsetMin(min: number) { return 60 * 1000 * min; }
function daysFromNow(days: number) { return new Date(Date.now() + offsetDays(days)); }
function minFromNow(min: number) { return new Date(Date.now() + offsetMin(min)); }

// ─── Date anchors ───
const now = new Date();
const cy = now.getFullYear();

async function main() {
  console.log('🌱 Start seeding...');

  // ─── Cleanup FK-safe ───
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

  // ─── Passwords ───
  const salt = await bcrypt.genSalt(10);
  const pwdSuper   = await bcrypt.hash('superadmin123', salt);
  const pwdGuru    = await bcrypt.hash('guru123', salt);
  const pwdSiswa   = await bcrypt.hash('siswa123', salt);
  const pwdAdmin   = await bcrypt.hash('admin123', salt);
  const pwdPengawas= await bcrypt.hash('pengawas123', salt);

  // ═══════════════════════════════════════════════════════════════
  // 1. SETTINGS
  // ═══════════════════════════════════════════════════════════════
  const settingsData = [
    { key: 'appName', value: 'Novatech CBT' },
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
  console.log(`✅ Settings: ${settingsData.length}`);

  // ═══════════════════════════════════════════════════════════════
  // 2. MAJORS
  // ═══════════════════════════════════════════════════════════════
  const majorsData = [
    { name: 'Rekayasa Perangkat Lunak', code: 'RPL', description: 'Pengembangan perangkat lunak dan aplikasi.' },
    { name: 'Teknik Komputer & Jaringan', code: 'TKJ', description: 'Infrastruktur jaringan dan administrasi sistem.' },
    { name: 'Akuntansi & Keuangan', code: 'AKL', description: 'Akuntansi dan pengelolaan keuangan.' },
    { name: 'Multimedia', code: 'MM', description: 'Desain grafis, animasi, dan produksi multimedia.' },
    { name: 'Perhotelan', code: 'HTL', description: 'Manajemen perhotelan dan pariwisata.' },
  ];
  await prisma.major.createMany({ data: majorsData });
  const majors = await prisma.major.findMany({ orderBy: { code: 'asc' } });
  console.log(`✅ Majors: ${majors.length}`);

  // ═══════════════════════════════════════════════════════════════
  // 3. ROMBEL (3 per major)
  // ═══════════════════════════════════════════════════════════════
  const rombels: { id: string; majorId: string }[] = [];
  for (const m of majors) {
    for (let g = 1; g <= 3; g++) {
      const r = await prisma.rombel.create({ data: { name: `X ${m.code} ${g}`, majorId: m.id } });
      rombels.push({ id: r.id, majorId: m.id });
    }
  }
  console.log(`✅ Rombels: ${rombels.length}`);

  // ═══════════════════════════════════════════════════════════════
  // 4. USERS
  // ═══════════════════════════════════════════════════════════════
  const superAdminNames = [
    'Dimas Prasetyo', 'Sari Wulandari', 'Agus Hidayat',
  ];
  const superUsers = await Promise.all(
    superAdminNames.map((name, i) =>
      prisma.user.create({ data: { username: `superadmin${i + 1}`, email: `sa${i + 1}@cbt.com`, password: pwdSuper, fullName: name, role: Role.SUPER_ADMIN } })
    )
  );

  const teacherNames = [
    'Budi Santoso, S.Pd', 'Siti Aminah, S.Pd', 'Rudi Hartono, M.Pd',
    'Dewi Lestari, S.S', 'Ahmad Fauzi, M.Si', 'Fitri Handayani, S.Kom',
    'Hendra Gunawan, S.Pd', 'Maya Anggraini, S.Pd',
  ];
  const teacherUsers = await Promise.all(
    teacherNames.map((name, i) =>
      prisma.user.create({ data: { username: `guru${i + 1}`, email: `guru${i + 1}@cbt.com`, password: pwdGuru, fullName: name, role: Role.GURU } })
    )
  );
  const teachers = await Promise.all(
    teacherUsers.map((u, i) =>
      prisma.teacher.create({ data: { userId: u.id, nip: `1987${String(100000 + i).slice(1)}` } })
    )
  );

  // 25 students spread across all rombels
  const studentNames = [
    'Ani Rahmawati', 'Budi Hartono', 'Citra Dewi', 'Deni Saputra', 'Eka Puspita',
    'Fajar Nugroho', 'Gita Permata', 'Hadi Prasetyo', 'Indah Lestari', 'Joko Susilo',
    'Kartika Sari', 'Lukman Hakim', 'Mega Wati', 'Nanda Pratama', 'Oktaviani Putri',
    'Putra Wirayudha', 'Qori Aulia', 'Rendi Saputra', 'Siska Amelia', 'Teguh Prayitno',
    'Umi Kalsum', 'Vina Oktaviani', 'Wahyu Setiawan', 'Xena Aulia', 'Yoga Pratama',
  ];
  const studentUsers = await Promise.all(
    studentNames.map((name, i) =>
      prisma.user.create({ data: { username: `siswa${i + 1}`, email: `siswa${i + 1}@cbt.com`, password: pwdSiswa, fullName: name, role: Role.SISWA } })
    )
  );
  const students = await Promise.all(
    studentUsers.map((u, i) => {
      const rb = rombels[i % rombels.length];
      return prisma.student.create({ data: { userId: u.id, nis: `${cy}${String(10000 + i).slice(1)}`, rombelId: rb.id, majorId: rb.majorId } });
    })
  );

  // Extra admin & pengawas
  const adminSekolahUser = await prisma.user.create({
    data: { username: 'admin_sekolah', email: 'admin@cbt.com', password: pwdAdmin, fullName: 'Kepala Sekolah', role: Role.ADMIN_SEKOLAH },
  });
  const pengawasUser = await prisma.user.create({
    data: { username: 'pengawas1', email: 'pengawas@cbt.com', password: pwdPengawas, fullName: 'Pengawas Ujian', role: Role.PENGAWAS },
  });
  console.log(`✅ Users: ${superUsers.length} SA, ${teachers.length} guru, ${students.length} siswa, + admin, + pengawas`);

  // ═══════════════════════════════════════════════════════════════
  // 5. SUBJECTS
  // ═══════════════════════════════════════════════════════════════
  const subjectsData = [
    { name: 'Matematika', code: 'MTK', description: 'Konsep numerik, aljabar, geometri, dan statistika.' },
    { name: 'Bahasa Indonesia', code: 'BIN', description: 'Keterampilan membaca, menulis, menyimak, dan berbicara.' },
    { name: 'Bahasa Inggris', code: 'BIG', description: 'Reading comprehension, grammar, and writing skills.' },
    { name: 'Pendidikan Pancasila', code: 'PPKN', description: 'Nilai kebangsaan, konstitusi, dan kewarganegaraan.' },
    { name: 'Informatika', code: 'INF', description: 'Komputasi, algoritma, dan literasi digital.' },
    { name: 'Produk Kreatif & Kewirausahaan', code: 'PKK', description: 'Inovasi, bisnis, dan proyek kewirausahaan.' },
    { name: 'Pendidikan Agama Islam', code: 'PAI', description: 'Pendidikan agama Islam dan budi pekerti.' },
    { name: 'Sejarah Indonesia', code: 'SJRH', description: 'Sejarah bangsa Indonesia.' },
  ];
  await prisma.subject.createMany({ data: subjectsData });
  const subjects = await prisma.subject.findMany({ orderBy: { code: 'asc' } });
  console.log(`✅ Subjects: ${subjects.length}`);

  // Link teachers to subjects (each teacher 1-3 subjects)
  const tsm = [
    [subjects[0].id, subjects[4].id],
    [subjects[1].id, subjects[6].id],
    [subjects[2].id],
    [subjects[3].id],
    [subjects[0].id, subjects[2].id, subjects[5].id],
    [subjects[1].id, subjects[3].id, subjects[4].id],
    [subjects[5].id, subjects[7].id],
    [subjects[6].id, subjects[7].id],
  ];
  await Promise.all(
    teachers.map((t, i) =>
      prisma.teacher.update({ where: { id: t.id }, data: { subjects: { connect: tsm[i].map((sid) => ({ id: sid })) } } })
    )
  );

  // ═══════════════════════════════════════════════════════════════
  // 6. EXAM GROUPS (varied)
  // ═══════════════════════════════════════════════════════════════
  const examGroupsData = [
    { name: `PAS ${cy - 1}`,   desc: `Penilaian Akhir Semester Ganjil ${cy - 1}`,         year: `${cy - 1}/${cy}`, sem: 'Ganjil', start: daysFromNow(-90), end: daysFromNow(-1) },
    { name: `ASTS Genap ${cy}`,desc: `Asesmen Tengah Semester Genap ${cy}`,               year: `${cy - 1}/${cy}`, sem: 'Genap',  start: daysFromNow(-14), end: daysFromNow(60) },
    { name: `ASAT ${cy - 1}`,  desc: `Asesmen Sumatif Akhir Tahun ${cy - 1}`,             year: `${cy - 1}/${cy}`, sem: 'Genap',  start: daysFromNow(-45), end: daysFromNow(30) },
    { name: `Try Out Nasional ${cy}`, desc: `Try Out persiapan ujian nasional ${cy}`,      year: `${cy - 1}/${cy}`, sem: 'Genap',  start: daysFromNow(-7),  end: daysFromNow(21) },
    { name: `UTS ${cy}`,       desc: `Ujian Tengah Semester Ganjil ${cy}`,                 year: `${cy}/${cy + 1}`, sem: 'Ganjil', start: daysFromNow(45),  end: daysFromNow(90) },
  ];
  const examGroups = await Promise.all(
    examGroupsData.map((eg) =>
      prisma.examGroup.create({ data: { name: eg.name, description: eg.desc, academicYear: eg.year, semester: eg.sem, startDate: eg.start, endDate: eg.end } })
    )
  );
  console.log(`✅ Exam Groups: ${examGroups.length}`);

  // ═══════════════════════════════════════════════════════════════
  // 7. QUESTION BANKS
  // ═══════════════════════════════════════════════════════════════
  const qBanksData = [
    { name: 'Bank Soal MTK - UTS',   subjIdx: 0, teacherIdx: 0, cat: 'UTS' },
    { name: 'Bank Soal MTK - UAS',   subjIdx: 0, teacherIdx: 0, cat: 'UAS' },
    { name: 'Bank Soal B. Indo',     subjIdx: 1, teacherIdx: 1, cat: 'UTS' },
    { name: 'Bank Soal B. Inggris',  subjIdx: 2, teacherIdx: 2, cat: 'UAS' },
    { name: 'Bank Soal PPKN',        subjIdx: 3, teacherIdx: 3, cat: 'UAS' },
    { name: 'Bank Soal Informatika', subjIdx: 4, teacherIdx: 5, cat: 'UTS' },
    { name: 'Bank Soal PKK',         subjIdx: 5, teacherIdx: 4, cat: 'UTS' },
    { name: 'Bank Soal PAI',         subjIdx: 6, teacherIdx: 6, cat: 'UAS' },
    { name: 'Bank Soal Sejarah',     subjIdx: 7, teacherIdx: 7, cat: 'UTS' },
  ];
  const qBanks = await Promise.all(
    qBanksData.map((qb) =>
      prisma.questionBank.create({ data: { name: qb.name, subjectId: subjects[qb.subjIdx].id, teacherId: teachers[qb.teacherIdx].id, category: qb.cat } })
    )
  );
  console.log(`✅ Question Banks: ${qBanks.length}`);

  // ═══════════════════════════════════════════════════════════════
  // 8. QUESTIONS with variety: PG, BS, MR, Essay, mediaUrl, tags
  // ═══════════════════════════════════════════════════════════════
  interface Opt { content: string; isCorrect: boolean }
  interface QDef { type: QuestionType; content: string; difficulty: Difficulty; points: number; options: Opt[]; mediaUrl?: string; mediaType?: string; tags?: string[] }

  const questionDefs: Record<number, QDef[]> = {
    0: [ // MTK UTS — 5 soal
      { type: 'PILIHAN_GANDA' as QuestionType, content: 'Nilai dari 12 × 15 adalah …', difficulty: 'MUDAH' as Difficulty, points: 10, options: [
        { content: '150', isCorrect: false }, { content: '180', isCorrect: true }, { content: '210', isCorrect: false }, { content: '300', isCorrect: false },
      ], tags: ['aritmatika', 'perkalian'] },
      { type: 'BENAR_SALAH' as QuestionType, content: 'Segitiga siku-siku memiliki sudut 90°.', difficulty: 'MUDAH' as Difficulty, points: 5, options: [
        { content: 'Benar', isCorrect: true }, { content: 'Salah', isCorrect: false },
      ], tags: ['geometri'] },
      { type: 'MULTIPLE_RESPONSE' as QuestionType, content: 'Manakah bilangan prima?', difficulty: 'SEDANG' as Difficulty, points: 15, options: [
        { content: '2', isCorrect: true }, { content: '4', isCorrect: false }, { content: '7', isCorrect: true }, { content: '9', isCorrect: false },
      ], tags: ['bilangan'] },
      { type: 'PILIHAN_GANDA' as QuestionType, content: 'Keliling persegi dengan sisi 5 cm adalah …', difficulty: 'MUDAH' as Difficulty, points: 10, options: [
        { content: '15 cm', isCorrect: false }, { content: '20 cm', isCorrect: true }, { content: '25 cm', isCorrect: false }, { content: '10 cm', isCorrect: false },
      ], tags: ['geometri', 'keliling'] },
      { type: 'ESSAY' as QuestionType, content: 'Gambarlah grafik fungsi y = 2x + 1 untuk x dari -3 sampai 3!', difficulty: 'SEDANG' as Difficulty, points: 20, options: [],
        mediaUrl: '/media/mtk/grafik1.png', mediaType: 'image', tags: ['fungsi', 'grafik'] },
    ],
    1: [ // MTK UAS — 4 soal
      { type: 'PILIHAN_GANDA' as QuestionType, content: 'Nilai dari √144 adalah …', difficulty: 'MUDAH' as Difficulty, points: 10, options: [
        { content: '10', isCorrect: false }, { content: '12', isCorrect: true }, { content: '14', isCorrect: false }, { content: '16', isCorrect: false },
      ], tags: ['akar'] },
      { type: 'ESSAY' as QuestionType, content: 'Jelaskan langkah-langkah menyelesaikan persamaan kuadrat ax² + bx + c = 0!', difficulty: 'SULIT' as Difficulty, points: 25, options: [], tags: ['persamaan-kuadrat'] },
      { type: 'PILIHAN_GANDA' as QuestionType, content: 'Jika f(x) = 2x + 3, nilai f(5) adalah …', difficulty: 'SEDANG' as Difficulty, points: 10, options: [
        { content: '10', isCorrect: false }, { content: '13', isCorrect: true }, { content: '15', isCorrect: false }, { content: '17', isCorrect: false },
      ], tags: ['fungsi'] },
      { type: 'BENAR_SALAH' as QuestionType, content: 'Luas lingkaran = π × r².', difficulty: 'MUDAH' as Difficulty, points: 5, options: [
        { content: 'Benar', isCorrect: true }, { content: 'Salah', isCorrect: false },
      ], tags: ['geometri', 'lingkaran'] },
    ],
    2: [ // B. Indo — 4 soal
      { type: 'PILIHAN_GANDA' as QuestionType, content: 'Antonim dari kata "besar" adalah …', difficulty: 'MUDAH' as Difficulty, points: 10, options: [
        { content: 'Tinggi', isCorrect: false }, { content: 'Kecil', isCorrect: true }, { content: 'Lebar', isCorrect: false }, { content: 'Panjang', isCorrect: false },
      ], tags: ['antonim', 'kosakata'] },
      { type: 'BENAR_SALAH' as QuestionType, content: 'Puisi diawali dengan bait.', difficulty: 'MUDAH' as Difficulty, points: 5, options: [
        { content: 'Benar', isCorrect: true }, { content: 'Salah', isCorrect: false },
      ], tags: ['puisi'] },
      { type: 'PILIHAN_GANDA' as QuestionType, content: 'Penulisan kata baku yang benar adalah …', difficulty: 'SEDANG' as Difficulty, points: 10, options: [
        { content: 'Aktif', isCorrect: true }, { content: 'Aktip', isCorrect: false }, { content: 'Efektif', isCorrect: false }, { content: 'Kreatif', isCorrect: false },
      ], tags: ['kata-baku'] },
      { type: 'MULTIPLE_RESPONSE' as QuestionType, content: 'Manakah yang termasuk jenis kata kerja?', difficulty: 'SEDANG' as Difficulty, points: 15, options: [
        { content: 'Berlari', isCorrect: true }, { content: 'Cantik', isCorrect: false }, { content: 'Memasak', isCorrect: true }, { content: 'Pintar', isCorrect: false },
      ], tags: ['tata-bahasa'] },
    ],
    3: [ // B. Inggris — 5 soal
      { type: 'PILIHAN_GANDA' as QuestionType, content: '"What is the synonym of "happy"?"', difficulty: 'MUDAH' as Difficulty, points: 10, options: [
        { content: 'Sad', isCorrect: false }, { content: 'Joyful', isCorrect: true }, { content: 'Angry', isCorrect: false }, { content: 'Tired', isCorrect: false },
      ], tags: ['synonym', 'vocabulary'] },
      { type: 'BENAR_SALAH' as QuestionType, content: '"The sun rises in the west."', difficulty: 'MUDAH' as Difficulty, points: 5, options: [
        { content: 'True', isCorrect: false }, { content: 'False', isCorrect: true },
      ], tags: ['reading'] },
      { type: 'MULTIPLE_RESPONSE' as QuestionType, content: 'Which of the following are fruits?', difficulty: 'SEDANG' as Difficulty, points: 15, options: [
        { content: 'Apple', isCorrect: true }, { content: 'Carrot', isCorrect: false }, { content: 'Banana', isCorrect: true }, { content: 'Potato', isCorrect: false },
      ], tags: ['vocabulary'] },
      { type: 'PILIHAN_GANDA' as QuestionType, content: '"He _____ to school every day." Pilih kata yang tepat.', difficulty: 'SEDANG' as Difficulty, points: 10, options: [
        { content: 'go', isCorrect: false }, { content: 'goes', isCorrect: true }, { content: 'going', isCorrect: false }, { content: 'went', isCorrect: false },
      ], tags: ['grammar', 'tenses'] },
      { type: 'ESSAY' as QuestionType, content: 'Write a short paragraph (80-100 words) about your hobby. Include why you like it and how often you do it.', difficulty: 'SEDANG' as Difficulty, points: 20, options: [], tags: ['writing'] },
    ],
    4: [ // PPKN — 4 soal
      { type: 'PILIHAN_GANDA' as QuestionType, content: 'Pancasila sebagai dasar negara tercantum dalam…', difficulty: 'SEDANG' as Difficulty, points: 10, options: [
        { content: 'UUD 1945', isCorrect: false }, { content: 'Pembukaan UUD 1945', isCorrect: true }, { content: 'Tap MPR', isCorrect: false }, { content: 'Perpres', isCorrect: false },
      ], tags: ['pancasila', 'dasar-negara'] },
      { type: 'MULTIPLE_RESPONSE' as QuestionType, content: 'Hak warga negara yang dijamin UUD 1945 antara lain…', difficulty: 'SEDANG' as Difficulty, points: 15, options: [
        { content: 'Mendapat pendidikan', isCorrect: true }, { content: 'Membayar pajak', isCorrect: false }, { content: 'Berpendapat', isCorrect: true }, { content: 'Melanggar hukum', isCorrect: false },
      ], tags: ['hak-warga', 'uud'] },
      { type: 'PILIHAN_GANDA' as QuestionType, content: 'Sila ke-3 Pancasila dilambangkan dengan…', difficulty: 'MUDAH' as Difficulty, points: 10, options: [
        { content: 'Bintang', isCorrect: false }, { content: 'Pohon Beringin', isCorrect: true }, { content: 'Rantai', isCorrect: false }, { content: 'Padi Kapas', isCorrect: false },
      ], tags: ['pancasila', 'lambang'] },
      { type: 'BENAR_SALAH' as QuestionType, content: 'NKRI adalah kepanjangan dari Negara Kesatuan Republik Indonesia.', difficulty: 'MUDAH' as Difficulty, points: 5, options: [
        { content: 'Benar', isCorrect: true }, { content: 'Salah', isCorrect: false },
      ], tags: ['nkri'] },
    ],
    5: [ // Informatika — 4 soal
      { type: 'PILIHAN_GANDA' as QuestionType, content: 'Struktur data yang bersifat LIFO (Last In First Out) disebut…', difficulty: 'SEDANG' as Difficulty, points: 10, options: [
        { content: 'Queue', isCorrect: false }, { content: 'Stack', isCorrect: true }, { content: 'Array', isCorrect: false }, { content: 'Linked List', isCorrect: false },
      ], tags: ['struktur-data'] },
      { type: 'BENAR_SALAH' as QuestionType, content: 'HTML adalah bahasa pemrograman.', difficulty: 'MUDAH' as Difficulty, points: 5, options: [
        { content: 'Benar', isCorrect: false }, { content: 'Salah', isCorrect: true },
      ], tags: ['html', 'web'] },
      { type: 'PILIHAN_GANDA' as QuestionType, content: 'Protokol yang digunakan untuk mengirim email adalah…', difficulty: 'MUDAH' as Difficulty, points: 10, options: [
        { content: 'FTP', isCorrect: false }, { content: 'SMTP', isCorrect: true }, { content: 'HTTP', isCorrect: false }, { content: 'TCP/IP', isCorrect: false },
      ], tags: ['jaringan', 'protokol'] },
      { type: 'ESSAY' as QuestionType, content: 'Jelaskan perbedaan antara algoritma iterasi dan rekursi. Berikan masing-masing satu contoh!', difficulty: 'SULIT' as Difficulty, points: 20, options: [], tags: ['algoritma'] },
    ],
    6: [ // PKK — 3 soal
      { type: 'PILIHAN_GANDA' as QuestionType, content: 'Kewirausahaan berasal dari kata "wira" yang berarti…', difficulty: 'MUDAH' as Difficulty, points: 10, options: [
        { content: 'Usaha', isCorrect: false }, { content: 'Pahlawan', isCorrect: true }, { content: 'Dagang', isCorrect: false }, { content: 'Modal', isCorrect: false },
      ], tags: ['kewirausahaan'] },
      { type: 'BENAR_SALAH' as QuestionType, content: 'Inovasi adalah kunci utama dalam kewirausahaan.', difficulty: 'MUDAH' as Difficulty, points: 5, options: [
        { content: 'Benar', isCorrect: true }, { content: 'Salah', isCorrect: false },
      ], tags: ['inovasi'] },
      { type: 'ESSAY' as QuestionType, content: 'Sebutkan dan jelaskan 4 fungsi manajemen (POAC)!', difficulty: 'SULIT' as Difficulty, points: 20, options: [], tags: ['manajemen', 'poac'] },
    ],
    7: [ // PAI — 3 soal
      { type: 'PILIHAN_GANDA' as QuestionType, content: 'Rukun Islam yang ke-3 adalah…', difficulty: 'MUDAH' as Difficulty, points: 10, options: [
        { content: 'Syahadat', isCorrect: false }, { content: 'Puasa', isCorrect: true }, { content: 'Zakat', isCorrect: false }, { content: 'Haji', isCorrect: false },
      ], tags: ['rukun-islam'] },
      { type: 'BENAR_SALAH' as QuestionType, content: 'Al-Quran diturunkan kepada Nabi Muhammad SAW melalui Malaikat Jibril.', difficulty: 'MUDAH' as Difficulty, points: 5, options: [
        { content: 'Benar', isCorrect: true }, { content: 'Salah', isCorrect: false },
      ], tags: ['al-quran'] },
      { type: 'PILIHAN_GANDA' as QuestionType, content: 'Jumlah surah dalam Al-Quran adalah…', difficulty: 'SEDANG' as Difficulty, points: 10, options: [
        { content: '113', isCorrect: false }, { content: '114', isCorrect: true }, { content: '115', isCorrect: false }, { content: '120', isCorrect: false },
      ], tags: ['al-quran'] },
    ],
    8: [ // Sejarah — 3 soal
      { type: 'PILIHAN_GANDA' as QuestionType, content: 'Proklamasi kemerdekaan Indonesia dibacakan pada tanggal…', difficulty: 'MUDAH' as Difficulty, points: 10, options: [
        { content: '16 Agustus 1945', isCorrect: false }, { content: '17 Agustus 1945', isCorrect: true }, { content: '18 Agustus 1945', isCorrect: false }, { content: '19 Agustus 1945', isCorrect: false },
      ], tags: ['proklamasi', 'kemerdekaan'] },
      { type: 'MULTIPLE_RESPONSE' as QuestionType, content: 'Tokoh-tokoh yang terlibat dalam peristiwa Rengasdengklok antara lain…', difficulty: 'SEDANG' as Difficulty, points: 15, options: [
        { content: 'Soekarno', isCorrect: true }, { content: 'Moh. Hatta', isCorrect: true }, { content: 'Sutan Syahrir', isCorrect: false }, { content: 'Ahmad Soebardjo', isCorrect: false },
      ], tags: ['rengasdengklok', 'tokoh'] },
      { type: 'ESSAY' as QuestionType, content: 'Jelaskan latar belakang terjadinya peristiwa Rengasdengklok!', difficulty: 'SULIT' as Difficulty, points: 20, options: [], tags: ['rengasdengklok', 'sejarah'] },
    ],
  };

  interface QResult { id: string; bankIdx: number; type: QuestionType }
  const questions: QResult[] = [];
  for (const [bk, arr] of Object.entries(questionDefs)) {
    const idx = Number(bk);
    for (const q of arr) {
      const created = await prisma.question.create({
        data: {
          questionBankId: qBanks[idx].id,
          type: q.type,
          content: q.content,
          difficulty: q.difficulty,
          points: q.points,
          tags: q.tags ?? [],
          mediaUrl: q.mediaUrl,
          mediaType: q.mediaType,
          options: q.options.length > 0
            ? { create: q.options.map((o, i) => ({ content: o.content, isCorrect: o.isCorrect, order: i + 1 })) }
            : undefined,
        },
      });
      questions.push({ id: created.id, bankIdx: idx, type: q.type });
    }
  }
  console.log(`✅ Questions: ${questions.length}`);

  // ═══════════════════════════════════════════════════════════════
  // 9. EXAMS (varied status: DRAFT, PUBLISHED, ONGOING, COMPLETED)
  // ═══════════════════════════════════════════════════════════════
  const examsDef = [
    // ── ONGOING exams (start in past, end in future) ──
    { title: `UTS Matematika - Genap ${cy}`, desc: 'Ujian Tengah Semester Matematika Wajib', subjIdx: 0, teachIdx: 0, grpIdx: 1, start: daysFromNow(-14), end: daysFromNow(7), dur: 90, pg: 70, status: ExamStatus.ONGOING as const, bankIdx: 0, randQ: true, randO: true, seb: false, cpp: true, fs: true, mv: 3, show: false, token: true },
    { title: `UAS Matematika - Ganjil ${cy - 1}`, desc: 'Ujian Akhir Semester Matematika', subjIdx: 0, teachIdx: 0, grpIdx: 0, start: daysFromNow(-91), end: daysFromNow(-65), dur: 120, pg: 65, status: ExamStatus.COMPLETED as const, bankIdx: 1, randQ: true, randO: true, seb: false, cpp: true, fs: false, mv: 5, show: true, token: false },
    { title: `UTS B. Indonesia - Genap ${cy}`, desc: 'Ujian Tengah Semester Bahasa Indonesia', subjIdx: 1, teachIdx: 1, grpIdx: 1, start: daysFromNow(-12), end: daysFromNow(9), dur: 90, pg: 70, status: ExamStatus.ONGOING as const, bankIdx: 2, randQ: true, randO: false, seb: false, cpp: false, fs: false, mv: 0, show: true, token: false },
    { title: 'Try Out B. Inggris', desc: 'Try Out persiapan ASAT Bahasa Inggris', subjIdx: 2, teachIdx: 2, grpIdx: 3, start: minFromNow(30), end: daysFromNow(14), dur: 60, pg: 60, status: ExamStatus.PUBLISHED as const, bankIdx: 3, randQ: false, randO: true, seb: true, cpp: true, fs: true, mv: 2, show: false, token: true },
    { title: `UAS PPKN - Ganjil ${cy - 1}`, desc: 'Ujian Akhir Semester PPKN', subjIdx: 3, teachIdx: 3, grpIdx: 0, start: daysFromNow(-88), end: daysFromNow(-60), dur: 90, pg: 70, status: ExamStatus.COMPLETED as const, bankIdx: 4, randQ: true, randO: true, seb: false, cpp: true, fs: false, mv: 4, show: true, token: false },
    // ── PUBLISHED (waiting for students) ──
    { title: 'Try Out Informatika', desc: 'Try Out persiapan ASAT Informatika', subjIdx: 4, teachIdx: 5, grpIdx: 3, start: daysFromNow(5), end: daysFromNow(30), dur: 90, pg: 65, status: ExamStatus.PUBLISHED as const, bankIdx: 5, randQ: true, randO: true, seb: false, cpp: true, fs: true, mv: 3, show: true, token: false },
    // ── DRAFT (not published) ──
    { title: 'UAS PKK (DRAFT)', desc: 'Ujian Akhir Semester PKK - belum dipublikasikan', subjIdx: 5, teachIdx: 4, grpIdx: 2, start: daysFromNow(30), end: daysFromNow(60), dur: 90, pg: 70, status: ExamStatus.DRAFT as const, bankIdx: 6, randQ: false, randO: false, seb: false, cpp: false, fs: false, mv: 0, show: true, token: false },
    { title: `PAS PAI ${cy}`, desc: 'Penilaian Akhir Semester PAI', subjIdx: 6, teachIdx: 6, grpIdx: 2, start: daysFromNow(21), end: daysFromNow(45), dur: 90, pg: 75, status: ExamStatus.PUBLISHED as const, bankIdx: 7, randQ: true, randO: false, seb: false, cpp: false, fs: false, mv: 2, show: true, token: true },
    { title: 'UAS Sejarah Indonesia', desc: 'Ujian Akhir Semester Sejarah', subjIdx: 7, teachIdx: 7, grpIdx: 2, start: daysFromNow(25), end: daysFromNow(50), dur: 90, pg: 60, status: ExamStatus.PUBLISHED as const, bankIdx: 8, randQ: true, randO: true, seb: false, cpp: false, fs: false, mv: 0, show: true, token: false },
  ];

  const exams = await Promise.all(
    examsDef.map((ed) =>
      prisma.exam.create({
        data: {
          title: ed.title,
          description: ed.desc,
          subjectId: subjects[ed.subjIdx].id,
          teacherId: teachers[ed.teachIdx].id,
          examGroupId: examGroups[ed.grpIdx].id,
          startTime: ed.start,
          endTime: ed.end,
          duration: ed.dur,
          token: ed.token ? token(8) : null,
          maxAttempts: 1,
          randomizeSoal: ed.randQ,
          randomizeOpsi: ed.randO,
          passingGrade: ed.pg,
          status: ed.status,
          showScore: ed.show,
          sebConfigKey: ed.seb ? `SEB-${ed.subjIdx + 1}${ed.teachIdx + 1}` : null,
          sebBrowserKey: ed.seb ? `BROWSER-${ed.subjIdx + 1}${ed.teachIdx + 1}` : null,
          requireSeb: ed.seb,
          blockKeyCopyPaste: ed.cpp,
          forceFullscreen: ed.fs,
          maxViolations: ed.mv,
          examQuestions: {
            create: questions.filter((q) => q.bankIdx === ed.bankIdx).map((q, i) => ({ questionId: q.id, order: i + 1 })),
          },
        },
      })
    )
  );
  console.log(`✅ Exams: ${exams.length} (${examsDef.map((e) => e.status).join(', ')})`);

  // ═══════════════════════════════════════════════════════════════
  // 10. EXAM SESSIONS (cover ALL statuses)
  // ═══════════════════════════════════════════════════════════════
  const sessionRecords: { id: string; examIdx: number; studentIdx: number; status: SessionStatus }[] = [];
  const allSessionStatuses: SessionStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'FINISHED', 'LOCKED'];

  for (let ei = 0; ei < exams.length; ei++) {
    // Each exam gets 3-6 sessions covering a range of statuses
    const count = 3 + (ei % 4); // 3,4,5,6,3,4,5,6,3
    const usedStudents = new Set<number>();

    for (let si = 0; si < count && si < students.length; si++) {
      let studentIdx = (ei * 7 + si * 5) % students.length;
      // Collision avoidance
      let attempts = 0;
      while (usedStudents.has(studentIdx) && attempts < students.length) {
        studentIdx = (studentIdx + 1) % students.length;
        attempts++;
      }
      if (usedStudents.has(studentIdx)) break;
      usedStudents.add(studentIdx);

      // Distribute statuses: first few get realistic, others mix
      let sessStatus: SessionStatus;
      if (si === 0) sessStatus = ei < 2 ? 'FINISHED' : 'IN_PROGRESS';
      else if (si === 1) sessStatus = ei === 0 ? 'SUBMITTED' : ei === 8 ? 'NOT_STARTED' : 'IN_PROGRESS';
      else if (si === 2) sessStatus = ei === 3 ? 'LOCKED' : 'SUBMITTED';
      else if (si === 3) sessStatus = 'LOCKED';
      else if (si === 4) sessStatus = 'NOT_STARTED';
      else sessStatus = allSessionStatuses[si % allSessionStatuses.length];

      // Adjust session status based on exam status
      if (examsDef[ei].status === 'COMPLETED' && sessStatus === 'IN_PROGRESS') sessStatus = 'FINISHED';
      if (examsDef[ei].status === 'DRAFT' && sessStatus !== 'NOT_STARTED') sessStatus = 'NOT_STARTED';
      if (examsDef[ei].status === 'PUBLISHED' && (sessStatus === 'FINISHED' || sessStatus === 'SUBMITTED')) sessStatus = 'IN_PROGRESS';

      const start = new Date(now.getTime() - rnd(5, 120) * 60 * 1000);
      const end = ['SUBMITTED', 'FINISHED', 'LOCKED'].includes(sessStatus)
        ? new Date(start.getTime() + rnd(10, examsDef[ei].dur) * 60 * 1000)
        : undefined;
      const score = end ? rnd(30, 100) : undefined;

      const session = await prisma.examSession.create({
        data: {
          examId: exams[ei].id,
          studentId: students[studentIdx].id,
          startTime: start,
          endTime: end,
          status: sessStatus,
          score: score,
          ipAddress: `192.168.${rnd(0, 255)}.${rnd(1, 254)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          lastActiveAt: sessStatus === 'IN_PROGRESS' ? new Date(now.getTime() - rnd(0, 10) * 60 * 1000) : undefined,
        },
      });
      sessionRecords.push({ id: session.id, examIdx: ei, studentIdx, status: sessStatus });
    }
  }
  console.log(`✅ Exam Sessions: ${sessionRecords.length} (statuses: ${[...new Set(sessionRecords.map(s => s.status))].join(', ')})`);

  // ═══════════════════════════════════════════════════════════════
  // 11. ANSWERS (for completed sessions: SUBMITTED, FINISHED, LOCKED)
  // ═══════════════════════════════════════════════════════════════
  let answerCount = 0;
  const completedSet = new Set<SessionStatus>(['SUBMITTED', 'FINISHED', 'LOCKED']);

  for (const sr of sessionRecords) {
    if (!completedSet.has(sr.status)) continue;

    const ed = examsDef[sr.examIdx];
    const examQuestionsForBank = questions.filter((q) => q.bankIdx === ed.bankIdx);
    if (examQuestionsForBank.length === 0) continue;

    const toAnswer = Math.min(rnd(2, examQuestionsForBank.length), examQuestionsForBank.length);

    for (let ai = 0; ai < toAnswer; ai++) {
      const q = examQuestionsForBank[ai];
      const opts = await prisma.questionOption.findMany({ where: { questionId: q.id } });
      const correctOpt = opts.find((o) => o.isCorrect);

      const isEssay = q.type === 'ESSAY' as QuestionType;
      const essayTexts = [
        'Langkah-langkah penyelesaian: pertama identifikasi variabel, kedua hitung menggunakan rumus, terakhir simpulkan hasilnya.',
        'Berdasarkan materi yang telah dipelajari, dapat disimpulkan bahwa konsep ini sangat penting dalam kehidupan sehari-hari.',
        'Jawaban: a. Identifikasi masalah, b. Rumuskan hipotesis, c. Lakukan eksperimen, d. Analisis data, e. Tarik kesimpulan.',
      ];

      const essayAnswer = isEssay ? pick(essayTexts) : undefined;
      const selectedOption = isEssay ? null : correctOpt?.id ?? null;
      const correct = isEssay ? null : correctOpt ? true : false;
      const sc = isEssay ? rnd(10, 20) : correctOpt ? q.type === 'MULTIPLE_RESPONSE' as QuestionType ? rnd(5, 15) : q.points : rnd(0, 2);

      await prisma.answer.create({
        data: {
          examSessionId: sr.id,
          questionId: q.id,
          selectedOption: selectedOption,
          isCorrect: correct,
          score: sc,
          essayAnswer: essayAnswer,
        },
      });
      answerCount++;
    }
  }
  console.log(`✅ Answers: ${answerCount}`);

  // ═══════════════════════════════════════════════════════════════
  // 12. VIOLATIONS (varied levels & types)
  // ═══════════════════════════════════════════════════════════════
  const vTypes = ['TAB_SWITCH', 'COPY_PASTE', 'MOUSE_LEAVE', 'FULLSCREEN_EXIT', 'DEVELOPER_TOOLS', 'RIGHT_CLICK', 'IDLE_TIMEOUT', 'MULTI_SCREEN_DETECTED'];
  const vDesc: Record<string, string> = {
    TAB_SWITCH: 'Pindah tab sebanyak 2 kali selama ujian',
    COPY_PASTE: 'Mendeteksi aktivitas copy-paste saat ujian',
    MOUSE_LEAVE: 'Kursor meninggalkan area ujian',
    FULLSCREEN_EXIT: 'Keluar dari mode fullscreen',
    DEVELOPER_TOOLS: 'Membuka developer tools (console/inspect)',
    RIGHT_CLICK: 'Melakukan klik kanan pada area ujian',
    IDLE_TIMEOUT: 'Tidak ada aktivitas selama 10 menit',
    MULTI_SCREEN_DETECTED: 'Mendeteksi multiple monitor saat ujian berlangsung',
  };
  const vLevels: ViolationLevel[] = ['RINGAN', 'SEDANG', 'BERAT', 'KRITIS'];

  const violationsData: { examSessionId: string; level: ViolationLevel; type: string; description: string; timestamp: Date }[] = [];
  for (const sr of sessionRecords) {
    // Only violations for non-trivial sessions
    if (sr.status === 'NOT_STARTED') continue;
    if (Math.random() > 0.45) continue; // ~55% sessions have violations

    const vCount = rnd(1, 4);
    for (let vi = 0; vi < vCount; vi++) {
      const vt = vTypes[(sr.examIdx + vi) % vTypes.length];
      violationsData.push({
        examSessionId: sr.id,
        level: vLevels[rnd(0, vLevels.length - 1)],
        type: vt,
        description: vDesc[vt] || `Pelanggaran ${vt}`,
        timestamp: new Date(now.getTime() - rnd(1, 120) * 60 * 1000),
      });
    }
  }
  if (violationsData.length > 0) {
    await prisma.violation.createMany({ data: violationsData });
  }
  console.log(`✅ Violations: ${violationsData.length}`);

  // ═══════════════════════════════════════════════════════════════
  // 13. EXAM TARGETS (rombels + majors)
  // ═══════════════════════════════════════════════════════════════
  for (let i = 0; i < exams.length; i++) {
    const rb = rombels[i % rombels.length];
    await prisma.examTargetRombel.create({ data: { examId: exams[i].id, rombelId: rb.id } });
    await prisma.examTargetMajor.create({ data: { examId: exams[i].id, majorId: rb.majorId } });
  }
  console.log('✅ Exam Targets: created');

  // ═══════════════════════════════════════════════════════════════
  // 14. CUSTOM ROLES
  // ═══════════════════════════════════════════════════════════════
  const cRoles = await Promise.all([
    prisma.customRole.create({ data: { name: 'Administrator', slug: 'administrator', description: 'Akses penuh ke semua fitur', isSystem: true } }),
    prisma.customRole.create({ data: { name: 'Guru', slug: 'guru', description: 'Akses guru: buat soal, ujian, lihat hasil', isSystem: true } }),
    prisma.customRole.create({ data: { name: 'Pengawas', slug: 'pengawas', description: 'Akses monitoring ujian saja', isSystem: false } }),
    prisma.customRole.create({ data: { name: 'Kepala Sekolah', slug: 'kepala-sekolah', description: 'Akses laporan dan statistik', isSystem: false } }),
    prisma.customRole.create({ data: { name: 'Wali Kelas', slug: 'wali-kelas', description: 'Akses laporan per rombel', isSystem: false } }),
  ]);
  console.log(`✅ Custom Roles: ${cRoles.length}`);

  // ═══════════════════════════════════════════════════════════════
  // 15. MENUS & SUBMENUS
  // ═══════════════════════════════════════════════════════════════
  const menuDefs = [
    { name: 'Dashboard', icon: 'LayoutDashboard', order: 1, subs: [
      { name: 'Overview', url: '/admin', order: 1 },
      { name: 'Aktivitas Terkini', url: '/admin/activity', order: 2 },
      { name: 'Statistik Cepat', url: '/admin/stats', order: 3 },
    ]},
    { name: 'Manajemen', icon: 'Settings', order: 2, subs: [
      { name: 'Pengguna', url: '/admin/users', order: 1 },
      { name: 'Role & Permissions', url: '/admin/roles', order: 2 },
      { name: 'Jurusan', url: '/admin/majors', order: 3 },
      { name: 'Rombel', url: '/admin/rombels', order: 4 },
    ]},
    { name: 'Ujian', icon: 'FileCheck', order: 3, subs: [
      { name: 'Bank Soal', url: '/admin/question-banks', order: 1 },
      { name: 'Buat Ujian', url: '/admin/exams/create', order: 2 },
      { name: 'Daftar Ujian', url: '/admin/exams', order: 3 },
      { name: 'Monitoring', url: '/admin/monitoring', order: 4 },
      { name: 'Kelompok Ujian', url: '/admin/exam-groups', order: 5 },
    ]},
    { name: 'Laporan', icon: 'BarChart3', order: 4, subs: [
      { name: 'Hasil Ujian', url: '/admin/results', order: 1 },
      { name: 'Analisis Soal', url: '/admin/analysis', order: 2 },
      { name: 'Rekap Pelanggaran', url: '/admin/violations', order: 3 },
    ]},
    { name: 'Pengaturan', icon: 'Cog', order: 5, subs: [
      { name: 'Pengaturan Umum', url: '/admin/settings', order: 1 },
      { name: 'Tema & Tampilan', url: '/admin/theme', order: 2 },
    ]},
  ];

  const menus: { id: string; subIds: string[] }[] = [];
  for (const md of menuDefs) {
    const menu = await prisma.menu.create({ data: { name: md.name, icon: md.icon, orderIndex: md.order } });
    const subIds: string[] = [];
    for (const sm of md.subs) {
      const sub = await prisma.subMenu.create({ data: { menuId: menu.id, name: sm.name, url: sm.url, orderIndex: sm.order } });
      subIds.push(sub.id);
    }
    menus.push({ id: menu.id, subIds });
  }
  const allSubMenus = menus.flatMap((m) => m.subIds);
  console.log(`✅ Menus: ${menus.length}, Submenus: ${allSubMenus.length}`);

  // ═══════════════════════════════════════════════════════════════
  // 16. PERMISSIONS
  // ═══════════════════════════════════════════════════════════════
  const permActions = ['create', 'read', 'update', 'delete', 'export', 'approve', 'monitor', 'lock', 'unlock'];
  const permLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const perms: { id: string }[] = [];

  for (const subId of allSubMenus) {
    // Get subMenu name for permission name
    const count = 3 + rnd(0, 2); // 3-5 per submenu
    for (let pi = 0; pi < count; pi++) {
      const action = permActions[(perms.length + pi) % permActions.length];
      const risk = permLevels[pi % permLevels.length];
      const perm = await prisma.permission.create({
        data: {
          subMenuId: subId,
          name: `submenu-${subId.slice(0, 8)}:${action}`,
          action,
          securityRiskLevel: risk,
        },
      });
      perms.push({ id: perm.id });
    }
  }
  console.log(`✅ Permissions: ${perms.length}`);

  // ═══════════════════════════════════════════════════════════════
  // 17. ROLE ↔ PERMISSION assignments
  // ═══════════════════════════════════════════════════════════════
  const rpData: { roleId: string; permissionId: string }[] = [];
  for (let ri = 0; ri < cRoles.length; ri++) {
    const skipEvery = ri === 0 ? 1 : ri + 1; // Admin gets all, others sparse
    for (let pi = 0; pi < perms.length; pi++) {
      if (ri === 0 || (pi + 1) % skipEvery === 0) {
        rpData.push({ roleId: cRoles[ri].id, permissionId: perms[pi].id });
      }
    }
  }
  await prisma.rolePermission.createMany({ data: rpData });
  console.log(`✅ Role-Permissions: ${rpData.length}`);

  // ═══════════════════════════════════════════════════════════════
  // 18. USER ROLES
  // ═══════════════════════════════════════════════════════════════
  const userRolesData: { userId: string; roleId: string }[] = [
    ...superUsers.map((u) => ({ userId: u.id, roleId: cRoles[0].id })),
    ...teachers.map((_, i) => ({ userId: teacherUsers[i].id, roleId: cRoles[1].id })),
    { userId: adminSekolahUser.id, roleId: cRoles[3].id },
    { userId: pengawasUser.id, roleId: cRoles[2].id },
  ];
  await prisma.userRole.createMany({ data: userRolesData });
  console.log(`✅ User-Roles: ${userRolesData.length}`);

  // ═══════════════════════════════════════════════════════════════
  // 19. ROLE AUDIT LOGS
  // ═══════════════════════════════════════════════════════════════
  const auditActions = ['ROLE_CREATED', 'ROLE_UPDATED', 'ROLE_DELETED', 'PERMISSION_GRANTED', 'PERMISSION_REVOKED'];
  const roleAuditLogs = await Promise.all(
    cRoles.slice(0, 4).map((role, i) =>
      prisma.roleAuditLog.create({
        data: {
          roleId: role.id,
          actorId: superUsers[i % superUsers.length].id,
          actionType: auditActions[i],
          ipAddress: `192.168.1.${100 + i}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      })
    )
  );
  console.log(`✅ Role Audit Logs: ${roleAuditLogs.length}`);

  // ═══════════════════════════════════════════════════════════════
  // 20. AUDIT LOGS (general)
  // ═══════════════════════════════════════════════════════════════
  const auditData: { userId: string; action: string; resource: string; ip?: string; userAgent?: string }[] = [
    { userId: superUsers[0].id, action: 'LOGIN', resource: 'Auth', ip: '192.168.1.10' },
    { userId: superUsers[0].id, action: 'SEED_DATABASE', resource: 'System', ip: '192.168.1.10' },
    { userId: teacherUsers[0].id, action: 'CREATE_EXAM', resource: 'Exam' },
    { userId: teacherUsers[1].id, action: 'CREATE_QUESTION', resource: 'Question' },
    { userId: studentUsers[0].id, action: 'START_EXAM', resource: 'ExamSession' },
    { userId: studentUsers[0].id, action: 'SUBMIT_ANSWER', resource: 'Answer' },
    { userId: superUsers[1].id, action: 'VIEW_REPORT', resource: 'Report' },
    { userId: teacherUsers[2].id, action: 'GRADE_ESSAY', resource: 'Answer' },
    { userId: adminSekolahUser.id, action: 'EXPORT_RESULTS', resource: 'Report' },
    { userId: pengawasUser.id, action: 'MONITOR_EXAM', resource: 'Monitoring' },
    { userId: teacherUsers[3].id, action: 'GENERATE_MEDIA', resource: 'Question' },
    { userId: superUsers[2].id, action: 'UPDATE_SETTING', resource: 'Settings' },
  ];
  await prisma.auditLog.createMany({ data: auditData });
  console.log(`✅ Audit Logs: ${auditData.length}`);

  // ═══════════════════════════════════════════════════════════════
  // 21. NOTIFICATIONS + RECIPIENTS + PREFERENCES
  // ═══════════════════════════════════════════════════════════════
  const notifDefs = [
    { type: 'EXAM_REMINDER' as NotificationType, priority: 'HIGH' as NotificationPriority, title: 'Pengumuman Ujian', msg: 'Ujian Matematika akan dimulai dalam 30 menit.', ref: exams[0]?.id, refType: 'exam', recip: [teacherUsers[0].id, superUsers[0].id] },
    { type: 'VIOLATION_DETECTED' as NotificationType, priority: 'URGENT' as NotificationPriority, title: 'Pelanggaran Terdeteksi', msg: 'Siswa terdeteksi membuka tab baru selama ujian berlangsung.', ref: exams[0]?.id, refType: 'exam', recip: [teacherUsers[0].id, pengawasUser.id] },
    { type: 'SYSTEM_ANNOUNCEMENT' as NotificationType, priority: 'NORMAL' as NotificationPriority, title: 'Sistem Siap Digunakan', msg: 'Seeder berhasil menjalankan semua data awal dengan sukses.', ref: null, refType: null, recip: superUsers.map((u) => u.id) },
    { type: 'EXAM_SUBMITTED' as NotificationType, priority: 'NORMAL' as NotificationPriority, title: 'Siswa Selesai Ujian', msg: 'Sejumlah siswa telah menyelesaikan Try Out Bahasa Inggris.', ref: exams[3]?.id, refType: 'exam', recip: [teacherUsers[2].id, superUsers[0].id] },
    { type: 'SESSION_EXPIRED' as NotificationType, priority: 'HIGH' as NotificationPriority, title: 'Sesi Ujian Berakhir', msg: 'Sesi ujian untuk 3 siswa telah berakhir otomatis karena waktu habis.', ref: exams[1]?.id, refType: 'exam', recip: [teacherUsers[0].id, pengawasUser.id, superUsers[1].id] },
    { type: 'EXAM_AUTO_SUBMIT' as NotificationType, priority: 'NORMAL' as NotificationPriority, title: 'Pengumpulan Otomatis', msg: 'Jawaban siswa yang belum dikumpulkan telah di-submit otomatis.', ref: exams[4]?.id, refType: 'exam', recip: [teacherUsers[3].id] },
    { type: 'IMPORT_COMPLETED' as NotificationType, priority: 'NORMAL' as NotificationPriority, title: 'Import Soal Selesai', msg: 'Bank soal berhasil diimport dari file Excel.', ref: null, refType: null, recip: [teacherUsers[1].id, superUsers[0].id] },
    { type: 'EXAM_REMINDER' as NotificationType, priority: 'HIGH' as NotificationPriority, title: 'Jadwal Ujian Besok', msg: 'Pengingat: Try Out Informatika akan dimulai besok pukul 08:00.', ref: exams[5]?.id, refType: 'exam', recip: [teacherUsers[5].id, pengawasUser.id] },
  ];

  const notifIds: string[] = [];
  for (const nd of notifDefs) {
    const n = await prisma.notification.create({
      data: {
        type: nd.type,
        priority: nd.priority,
        title: nd.title,
        message: nd.msg,
        referenceId: nd.ref,
        referenceType: nd.refType,
        createdBy: superUsers[0].id,
      },
    });
    notifIds.push(n.id);
    await prisma.notificationRecipient.createMany({
      data: nd.recip.map((uid) => ({ notificationId: n.id, userId: uid })),
    });
  }
  console.log(`✅ Notifications: ${notifIds.length}`);

  // ── Notification Preferences ──
  const allNotifTypes = ['EXAM_SUBMITTED', 'EXAM_AUTO_SUBMIT', 'VIOLATION_DETECTED', 'IMPORT_COMPLETED', 'IMPORT_FAILED', 'EXAM_REMINDER', 'SESSION_EXPIRED', 'SYSTEM_ANNOUNCEMENT'];
  const prefUsers = [...superUsers, ...teacherUsers.slice(0, 4), pengawasUser, adminSekolahUser];
  const prefData: { userId: string; type: string; enabled: boolean }[] = [];
  for (const u of prefUsers) {
    for (const nt of allNotifTypes) {
      prefData.push({ userId: u.id, type: nt, enabled: true });
    }
  }
  await prisma.notificationPreference.createMany({ data: prefData });
  console.log(`✅ Notification Preferences: ${prefData.length}`);

  // ── Notification Role Policies ──
  for (const role of cRoles.slice(0, 4)) {
    for (const nt of allNotifTypes) {
      await prisma.notificationRolePolicy.create({
        data: { roleId: role.id, type: nt as NotificationType, isEnabled: true },
      }).catch(() => {}); // skip duplicates
    }
  }
  console.log('✅ Notification Role Policies: created');

  // ═══════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════
  const summary = [
    ['Settings', settingsData.length],
    ['Majors', majors.length],
    ['Rombels', rombels.length],
    ['Users', await prisma.user.count()],
    ['Subjects', subjects.length],
    ['Exam Groups', examGroups.length],
    ['Question Banks', qBanks.length],
    ['Questions', questions.length],
    ['Exams', exams.length],
    ['Exam Sessions', sessionRecords.length],
    ['Answers', answerCount],
    ['Violations', violationsData.length],
    ['Custom Roles', cRoles.length],
    ['Menus', menus.length],
    ['Sub-Menus', allSubMenus.length],
    ['Permissions', perms.length],
    ['Role-Permissions', rpData.length],
    ['User-Roles', userRolesData.length],
    ['Role Audit Logs', roleAuditLogs.length],
    ['Audit Logs', auditData.length],
    ['Notifications', notifIds.length],
    ['Notification Prefs', prefData.length],
  ];
  const maxLen = Math.max(...summary.map(([k]) => k.length));
  console.log('\n' + '═'.repeat(50));
  console.log('🌱 SEEDING COMPLETE');
  console.log('═'.repeat(50));
  for (const [k, v] of summary) {
    console.log(` ${k.padEnd(maxLen)} : ${v}`);
  }
  console.log('═'.repeat(50));

  // Print tokens for exams that have them
  const tokenExams = await prisma.exam.findMany({
    where: { token: { not: null } },
    select: { title: true, token: true },
  });
  if (tokenExams.length > 0) {
    console.log('\n🔑 Exam Tokens:');
    for (const e of tokenExams) {
      console.log(` ${e.title}: ${e.token}`);
    }
  }

  console.log('\n✨ Coverage:');
  console.log('  ExamStatus:', Object.values(ExamStatus).join(', '));
  console.log('  SessionStatus:', Object.values(SessionStatus).join(', '));
  console.log('  QuestionType:', Object.values(QuestionType).join(', '));
  console.log('  Difficulty:', Object.values(Difficulty).join(', '));
  console.log('  ViolationLevel:', Object.values(ViolationLevel).join(', '));
  console.log('  NotificationType:', Object.values(NotificationType).join(', '));
  console.log('  NotificationPriority:', Object.values(NotificationPriority).join(', '));
  console.log('  Roles:', Object.values(Role).join(', '));
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
