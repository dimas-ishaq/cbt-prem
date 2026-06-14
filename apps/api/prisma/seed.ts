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
  await prisma.roleAuditLog.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.subMenu.deleteMany({});
  await prisma.menu.deleteMany({});
  await prisma.customRole.deleteMany({});

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
  await prisma.major.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.setting.deleteMany({});

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

  // 3.5. Seed Menus, SubMenus, and Permissions
  console.log('Seeding menus, submenus, and permissions...');
  const menuData = [
    {
      name: 'User Management',
      icon: 'FiUsers',
      orderIndex: 1,
      subMenus: [
        {
          name: 'Daftar Pengguna',
          url: '/admin/users',
          orderIndex: 1,
          permissions: [
            { name: 'users:view', action: 'view', description: 'Melihat daftar pengguna', securityRiskLevel: 'LOW' },
            { name: 'users:create', action: 'create', description: 'Membuat pengguna baru', securityRiskLevel: 'MEDIUM' },
            { name: 'users:update', action: 'update', description: 'Mengubah data pengguna', securityRiskLevel: 'MEDIUM' },
            { name: 'users:delete', action: 'delete', description: 'Menghapus pengguna secara permanen', securityRiskLevel: 'CRITICAL' },
            { name: 'users:export', action: 'export', description: 'Mengekspor data pengguna', securityRiskLevel: 'MEDIUM' },
            { name: 'users:import', action: 'import', description: 'Mengimpor data pengguna', securityRiskLevel: 'HIGH' },
          ],
        },
      ],
    },
    {
      name: 'Akademik',
      icon: 'FiBookOpen',
      orderIndex: 2,
      subMenus: [
        {
          name: 'Mata Pelajaran',
          url: '/admin/subjects',
          orderIndex: 1,
          permissions: [
            { name: 'subjects:view', action: 'view', description: 'Melihat mata pelajaran', securityRiskLevel: 'LOW' },
            { name: 'subjects:create', action: 'create', description: 'Membuat mata pelajaran', securityRiskLevel: 'LOW' },
            { name: 'subjects:update', action: 'update', description: 'Mengubah mata pelajaran', securityRiskLevel: 'LOW' },
            { name: 'subjects:delete', action: 'delete', description: 'Menghapus mata pelajaran', securityRiskLevel: 'MEDIUM' },
          ],
        },
        {
          name: 'Data Guru',
          url: '/admin/teachers',
          orderIndex: 2,
          permissions: [
            { name: 'teachers:view', action: 'view', description: 'Melihat profil guru', securityRiskLevel: 'LOW' },
            { name: 'teachers:create', action: 'create', description: 'Membuat akun guru', securityRiskLevel: 'MEDIUM' },
            { name: 'teachers:update', action: 'update', description: 'Mengubah data guru', securityRiskLevel: 'MEDIUM' },
            { name: 'teachers:delete', action: 'delete', description: 'Menghapus akun guru', securityRiskLevel: 'HIGH' },
          ],
        },
        {
          name: 'Data Siswa',
          url: '/admin/students',
          orderIndex: 3,
          permissions: [
            { name: 'students:view', action: 'view', description: 'Melihat profil siswa', securityRiskLevel: 'LOW' },
            { name: 'students:create', action: 'create', description: 'Membuat akun siswa', securityRiskLevel: 'MEDIUM' },
            { name: 'students:update', action: 'update', description: 'Mengubah data siswa', securityRiskLevel: 'MEDIUM' },
            { name: 'students:delete', action: 'delete', description: 'Menghapus akun siswa', securityRiskLevel: 'HIGH' },
          ],
        },
        {
          name: 'Konsentrasi Keahlian',
          url: '/admin/majors',
          orderIndex: 4,
          permissions: [
            { name: 'majors:view', action: 'view', description: 'Melihat daftar jurusan', securityRiskLevel: 'LOW' },
            { name: 'majors:create', action: 'create', description: 'Membuat jurusan baru', securityRiskLevel: 'MEDIUM' },
            { name: 'majors:update', action: 'update', description: 'Mengubah data jurusan', securityRiskLevel: 'MEDIUM' },
            { name: 'majors:delete', action: 'delete', description: 'Menghapus jurusan', securityRiskLevel: 'HIGH' },
          ],
        },
      ],
    },
    {
      name: 'CBT Management',
      icon: 'FiCpu',
      orderIndex: 3,
      subMenus: [
        {
          name: 'Bank Soal',
          url: '/admin/questions',
          orderIndex: 1,
          permissions: [
            { name: 'questions:view', action: 'view', description: 'Melihat bank soal', securityRiskLevel: 'LOW' },
            { name: 'questions:create', action: 'create', description: 'Membuat soal ujian', securityRiskLevel: 'MEDIUM' },
            { name: 'questions:update', action: 'update', description: 'Mengubah soal ujian', securityRiskLevel: 'HIGH' },
            { name: 'questions:delete', action: 'delete', description: 'Menghapus soal ujian', securityRiskLevel: 'MEDIUM' },
          ],
        },
        {
          name: 'Jadwal Ujian',
          url: '/admin/exams',
          orderIndex: 2,
          permissions: [
            { name: 'exams:view', action: 'view', description: 'Melihat jadwal ujian', securityRiskLevel: 'LOW' },
            { name: 'exams:create', action: 'create', description: 'Membuat jadwal ujian baru', securityRiskLevel: 'MEDIUM' },
            { name: 'exams:update', action: 'update', description: 'Mengubah jadwal ujian', securityRiskLevel: 'MEDIUM' },
            { name: 'exams:delete', action: 'delete', description: 'Menghapus jadwal ujian', securityRiskLevel: 'HIGH' },
            { name: 'exams:approve', action: 'approve', description: 'Menyetujui rilis ujian', securityRiskLevel: 'HIGH' },
          ],
        },
        {
          name: 'Sesi Ujian',
          url: '/admin/sessions',
          orderIndex: 3,
          permissions: [
            { name: 'sessions:view', action: 'view', description: 'Melihat sesi aktif siswa', securityRiskLevel: 'LOW' },
            { name: 'sessions:create', action: 'create', description: 'Membuat sesi ujian manual', securityRiskLevel: 'MEDIUM' },
            { name: 'sessions:update', action: 'update', description: 'Mengatur ulang sesi siswa (reset)', securityRiskLevel: 'MEDIUM' },
            { name: 'sessions:delete', action: 'delete', description: 'Menghapus sesi ujian', securityRiskLevel: 'HIGH' },
            { name: 'sessions:monitor', action: 'monitor', description: 'Memantau aktivitas ujian / anti-cheat', securityRiskLevel: 'MEDIUM' },
          ],
        },
      ],
    },
    {
      name: 'Pengaturan',
      icon: 'FiSettings',
      orderIndex: 4,
      subMenus: [
        {
          name: 'Pengaturan Umum',
          url: '/admin/settings',
          orderIndex: 1,
          permissions: [
            { name: 'settings:view', action: 'view', description: 'Melihat konfigurasi aplikasi', securityRiskLevel: 'LOW' },
            { name: 'settings:update', action: 'update', description: 'Mengubah konfigurasi umum', securityRiskLevel: 'HIGH' },
          ],
        },
        {
          name: 'Manajemen Akses',
          url: '/admin/roles',
          orderIndex: 2,
          permissions: [
            { name: 'roles:view', action: 'view', description: 'Melihat daftar role', securityRiskLevel: 'LOW' },
            { name: 'roles:create', action: 'create', description: 'Membuat role baru', securityRiskLevel: 'HIGH' },
            { name: 'roles:update', action: 'update', description: 'Mengubah hak akses role', securityRiskLevel: 'HIGH' },
            { name: 'roles:delete', action: 'delete', description: 'Menghapus role kustom', securityRiskLevel: 'HIGH' },
          ],
        },
      ],
    },
  ];

  const allPermissions: any[] = [];
  for (const m of menuData) {
    const createdMenu = await prisma.menu.create({
      data: {
        name: m.name,
        icon: m.icon,
        orderIndex: m.orderIndex,
      },
    });

    for (const sm of m.subMenus) {
      const createdSubMenu = await prisma.subMenu.create({
        data: {
          menuId: createdMenu.id,
          name: sm.name,
          url: sm.url,
          orderIndex: sm.orderIndex,
        },
      });

      for (const p of sm.permissions) {
        const createdPerm = await prisma.permission.create({
          data: {
            subMenuId: createdSubMenu.id,
            name: p.name,
            action: p.action,
            description: p.description,
            securityRiskLevel: p.securityRiskLevel,
          },
        });
        allPermissions.push(createdPerm);
      }
    }
  }

  // Create Roles
  console.log('Seeding custom roles...');
  const superAdminRole = await prisma.customRole.create({
    data: {
      name: 'Super Admin',
      slug: 'super-admin',
      description: 'Akses penuh ke semua modul sistem',
      isSystem: true,
    },
  });

  const guruRole = await prisma.customRole.create({
    data: {
      name: 'Guru',
      slug: 'guru',
      description: 'Akses pengelolaan bank soal dan ujian',
      isSystem: true,
    },
  });

  const siswaRole = await prisma.customRole.create({
    data: {
      name: 'Siswa',
      slug: 'siswa',
      description: 'Akses mengerjakan ujian saja',
      isSystem: true,
    },
  });

  // Assign permissions to Super Admin (all)
  for (const perm of allPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: superAdminRole.id,
        permissionId: perm.id,
      },
    });
  }

  // Assign permissions to Guru
  const guruPerms = allPermissions.filter((p) =>
    p.name.startsWith('questions:') ||
    p.name.startsWith('exams:') ||
    p.name.startsWith('sessions:') ||
    p.name === 'subjects:view' ||
    p.name === 'teachers:view' ||
    p.name === 'students:view' ||
    p.name === 'majors:view'
  );
  for (const perm of guruPerms) {
    await prisma.rolePermission.create({
      data: {
        roleId: guruRole.id,
        permissionId: perm.id,
      },
    });
  }

  // Assign user roles
  await prisma.userRole.create({
    data: {
      userId: superAdmin.id,
      roleId: superAdminRole.id,
    },
  });

  await prisma.userRole.create({
    data: {
      userId: teacherUser.id,
      roleId: guruRole.id,
    },
  });

  await prisma.userRole.create({
    data: {
      userId: studentUser.id,
      roleId: siswaRole.id,
    },
  });

  console.log('Role assignments completed.');


  // 4. Create Subjects
  const mathSubject = await prisma.subject.create({
    data: {
      name: 'Matematika Wajib',
      code: 'MATH101',
      description: 'Mata pelajaran matematika dasar untuk kelas X',
    },
  });

  // 4.5. Seed Default Majors
  console.log('Seeding default majors...');
  const rplMajor = await prisma.major.create({
    data: {
      name: 'Rekayasa Perangkat Lunak',
      code: 'RPL',
      description: 'Konsentrasi keahlian pengembangan perangkat lunak dan pemrograman.',
    },
  });

  await prisma.major.create({
    data: {
      name: 'Teknik Komputer dan Jaringan',
      code: 'TKJ',
      description: 'Konsentrasi keahlian infrastruktur jaringan, hardware, dan sistem operasi.',
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
      majorId: rplMajor.id,
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

  // 9. Create Default Settings
  await prisma.setting.createMany({
    data: [
      { key: 'appName', value: 'CBT Enterprise' },
      { key: 'logoUrl', value: '' },
      { key: 'timezone', value: 'Asia/Jakarta' },
      { key: 'language', value: 'id' },
    ],
  });
  console.log('Default settings created.');
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
