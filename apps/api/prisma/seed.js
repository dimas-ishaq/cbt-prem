"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = __importDefault(require("pg"));
const bcrypt = __importStar(require("bcryptjs"));
const pool = new pg_1.default.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('Start seeding...');
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
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const teacherPassword = await bcrypt.hash('guru123', salt);
    const studentPassword = await bcrypt.hash('siswa123', salt);
    const superAdmin = await prisma.user.create({
        data: {
            username: 'admin',
            email: 'admin@cbtenterprise.com',
            password: adminPassword,
            fullName: 'Super Admin CBT',
            role: client_1.Role.SUPER_ADMIN,
        },
    });
    const teacherUser = await prisma.user.create({
        data: {
            username: 'guru1',
            email: 'guru1@cbtenterprise.com',
            password: teacherPassword,
            fullName: 'Budi Santoso, S.Pd',
            role: client_1.Role.GURU,
        },
    });
    const studentUser = await prisma.user.create({
        data: {
            username: 'siswa1',
            email: 'siswa1@cbtenterprise.com',
            password: studentPassword,
            fullName: 'Muhammad Rizky',
            role: client_1.Role.SISWA,
        },
    });
    console.log('Users created.');
    const mathSubject = await prisma.subject.create({
        data: {
            name: 'Matematika Wajib',
            code: 'MATH101',
            description: 'Mata pelajaran matematika dasar untuk kelas X',
        },
    });
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
    const questionBank = await prisma.questionBank.create({
        data: {
            name: 'Bank Soal Aljabar Linear',
            subjectId: mathSubject.id,
            teacherId: teacher.id,
            category: 'Ulangan Harian',
        },
    });
    console.log('Question bank created.');
    const q1 = await prisma.question.create({
        data: {
            questionBankId: questionBank.id,
            type: client_1.QuestionType.PILIHAN_GANDA,
            content: 'Tentukan nilai x dari persamaan linear berikut: 3x + 5 = 20',
            difficulty: client_1.Difficulty.MUDAH,
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
    const q2 = await prisma.question.create({
        data: {
            questionBankId: questionBank.id,
            type: client_1.QuestionType.BENAR_SALAH,
            content: 'Persamaan y = mx + c selalu menggambarkan sebuah grafik garis lurus.',
            difficulty: client_1.Difficulty.MUDAH,
            points: 10,
            options: {
                create: [
                    { content: 'Benar', isCorrect: true, order: 1 },
                    { content: 'Salah', isCorrect: false, order: 2 },
                ],
            },
        },
    });
    const q3 = await prisma.question.create({
        data: {
            questionBankId: questionBank.id,
            type: client_1.QuestionType.MULTIPLE_RESPONSE,
            content: 'Manakah dari pernyataan berikut yang benar mengenai matriks persegi? (Pilih semua yang benar)',
            difficulty: client_1.Difficulty.SEDANG,
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
    const q4 = await prisma.question.create({
        data: {
            questionBankId: questionBank.id,
            type: client_1.QuestionType.ESSAY,
            content: 'Jelaskan langkah-langkah menyelesaikan Sistem Persamaan Linear Dua Variabel (SPLDV) menggunakan metode eliminasi dan substitusi.',
            difficulty: client_1.Difficulty.SULIT,
            points: 30,
        },
    });
    console.log('Questions created.');
    const now = new Date();
    const startTime = new Date(now.getTime() - 10 * 60 * 1000);
    const endTime = new Date(now.getTime() + 120 * 60 * 1000);
    const exam = await prisma.exam.create({
        data: {
            title: 'Ujian Tengah Semester - Aljabar',
            description: 'Kerjakan soal-soal berikut dengan jujur. Sistem menggunakan pengawasan penuh (proctoring).',
            subjectId: mathSubject.id,
            teacherId: teacher.id,
            startTime: startTime,
            endTime: endTime,
            duration: 90,
            status: client_1.ExamStatus.PUBLISHED,
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
//# sourceMappingURL=seed.js.map