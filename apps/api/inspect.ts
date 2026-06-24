import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const examId = '7044ab6e-151a-42fe-a073-a1d6a348ca22';
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      examSessions: {
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      },
      targetRombels: {
        include: {
          rombel: true,
        },
      },
      targetMajors: {
        include: {
          major: true,
        },
      },
    },
  });

  if (!exam) {
    console.log('Exam not found');
    return;
  }

  console.log('--- Exam Details ---');
  console.log(`Title: ${exam.title}`);
  console.log(`Status: ${exam.status}`);
  console.log(`Sessions count: ${exam.examSessions.length}`);
  console.log(`Target Rombels:`, exam.targetRombels.map(r => r.rombel.name));
  console.log(`Target Majors:`, exam.targetMajors.map(m => m.major.name));

  console.log('--- Sessions ---');
  for (const session of exam.examSessions) {
    console.log(`Session ID: ${session.id}`);
    console.log(`Student: ${session.student.user.fullName} (${session.student.user.username})`);
    console.log(`Status: ${session.status}`);
    console.log(`Score: ${session.score}`);
    console.log(`Start: ${session.startTime}, End: ${session.endTime}`);
    console.log('-----------------');
  }

  // Let's also check all exam sessions in the DB to see if any exist
  const allSessions = await prisma.examSession.findMany({
    include: {
      exam: true,
      student: {
        include: {
          user: true,
        },
      },
    },
  });
  console.log(`Total exam sessions in DB: ${allSessions.length}`);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
