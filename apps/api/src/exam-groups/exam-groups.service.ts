import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamGroupDto } from './dto/create-exam-group.dto';
import { UpdateExamGroupDto } from './dto/update-exam-group.dto';
import * as ExcelJS from 'exceljs';
import type { Response } from 'express';

@Injectable()
export class ExamGroupsService {
  constructor(private prisma: PrismaService) {}

  async create(createExamGroupDto: CreateExamGroupDto) {
    const data: any = { ...createExamGroupDto };
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);
    return this.prisma.examGroup.create({
      data,
    });
  }

  async findAll(skip?: number, take?: number) {
    const [data, total] = await Promise.all([
      this.prisma.examGroup.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { exams: true },
          },
        },
        ...(skip !== undefined && take !== undefined ? { skip, take } : {}),
      }),
      this.prisma.examGroup.count(),
    ]);
    return { data, total };
  }

  async findOne(id: string) {
    const group = await this.prisma.examGroup.findUnique({
      where: { id },
      include: {
        exams: {
          include: {
            subject: true,
            _count: {
              select: { examSessions: true },
            },
          },
          orderBy: { startTime: 'asc' },
        },
      },
    });
    if (!group) throw new NotFoundException('Kelompok ujian tidak ditemukan');
    return group;
  }

  async update(id: string, updateExamGroupDto: UpdateExamGroupDto) {
    await this.findOne(id);
    const data: any = { ...updateExamGroupDto };
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);
    return this.prisma.examGroup.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.examGroup.delete({
      where: { id },
    });
  }

  /**
   * Aggregates the report ledger for an exam group.
   * Returns:
   *  - exams: list of exams in the group (columns)
   *  - ledger: per student × per exam scores (null = not submitted)
   *  - unsubmitted: students with missing exams per mapel
   *  - examStats: summary metrics per exam
   *
   * NOTE: Rata-rata siswa hanya dihitung jika SEMUA mapel sudah dikerjakan.
   */
  async getReportLedger(groupId: string) {
    const group = await this.prisma.examGroup.findUnique({
      where: { id: groupId },
      include: {
        exams: {
          include: {
            subject: true,
            targetRombels: {
              include: {
                rombel: {
                  include: {
                    students: {
                      include: {
                        user: {
                          select: { id: true, fullName: true, username: true },
                        },
                        rombel: { select: { id: true, name: true } },
                        major: { select: { id: true, name: true } },
                      },
                    },
                  },
                },
              },
            },
            examSessions: {
              select: {
                studentId: true,
                status: true,
                score: true,
                startTime: true,
                endTime: true,
                student: {
                  select: {
                    id: true,
                    user: {
                      select: { id: true, fullName: true, username: true },
                    },
                    rombel: { select: { id: true, name: true } },
                    major: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
          orderBy: { startTime: 'asc' },
        },
      },
    });

    if (!group) throw new NotFoundException('Kelompok ujian tidak ditemukan');

    // Build unique set of all students enrolled in any target rombel
    const studentMap = new Map<
      string,
      {
        studentId: string;
        userId: string;
        fullName: string;
        username: string;
        rombel: { id: string; name: string } | null;
        major: { id: string; name: string } | null;
      }
    >();

    for (const exam of group.exams) {
      for (const tr of exam.targetRombels) {
        for (const student of tr.rombel.students) {
          if (!studentMap.has(student.id)) {
            studentMap.set(student.id, {
              studentId: student.id,
              userId: student.user.id,
              fullName: student.user.fullName,
              username: student.user.username,
              rombel: student.rombel ?? null,
              major: student.major ?? null,
            });
          }
        }
      }
    }

    const exams = group.exams.map((e) => ({
      id: e.id,
      title: e.title,
      subject: e.subject?.name ?? '-',
      startTime: e.startTime,
      endTime: e.endTime,
      passingGrade: e.passingGrade ?? 0,
    }));

    const SUBMITTED_STATUSES = ['SUBMITTED', 'FINISHED'];

    // Build ledger rows
    const ledger = Array.from(studentMap.values()).map((student) => {
      const scores: Record<string, number | null> = {};
      const statuses: Record<string, string | null> = {};

      for (const exam of group.exams) {
        const session = exam.examSessions.find(
          (s) => s.studentId === student.studentId,
        );
        if (!session) {
          scores[exam.id] = null;
          statuses[exam.id] = 'NOT_STARTED';
        } else if (SUBMITTED_STATUSES.includes(session.status)) {
          scores[exam.id] = session.score ?? 0;
          statuses[exam.id] = 'SUBMITTED';
        } else {
          scores[exam.id] = null;
          statuses[exam.id] = session.status;
        }
      }

      // Average only if ALL exams submitted — per user request
      const allScores = exams.map((e) => scores[e.id]);
      const allSubmitted = allScores.every((v) => v !== null);
      const average =
        allSubmitted && exams.length > 0
          ? allScores.reduce((a, b) => a + b, 0) / allScores.length
          : null;

      return { ...student, scores, statuses, average };
    });

    // Unsubmitted: per student, list missing exams (not yet submitted)
    const unsubmitted = ledger
      .map((student) => ({
        studentId: student.studentId,
        fullName: student.fullName,
        username: student.username,
        rombel: student.rombel,
        major: student.major,
        missingExams: exams
          .filter((e) => student.statuses[e.id] !== 'SUBMITTED')
          .map((e) => ({
            examId: e.id,
            title: e.title,
            subject: e.subject,
            status: student.statuses[e.id],
          })),
      }))
      .filter((s) => s.missingExams.length > 0);

    // Per-exam aggregated stats
    const examStats = exams.map((exam) => {
      const submitted = ledger.filter(
        (s) => s.statuses[exam.id] === 'SUBMITTED',
      );
      const scores = submitted.map((s) => s.scores[exam.id]);
      const avg =
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : null;
      const passed = scores.filter((v) => v >= exam.passingGrade).length;
      return {
        examId: exam.id,
        title: exam.title,
        subject: exam.subject,
        participantCount: submitted.length,
        totalEnrolled: studentMap.size,
        averageScore: avg,
        passedCount: passed,
        passRate: submitted.length > 0 ? (passed / submitted.length) * 100 : 0,
      };
    });

    return {
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        academicYear: group.academicYear,
        semester: group.semester,
        startDate: group.startDate,
        endDate: group.endDate,
      },
      exams,
      ledger,
      unsubmitted,
      examStats,
      totalStudents: studentMap.size,
    };
  }

  /**
   * Export the ledger as an Excel (.xlsx) streamed to response.
   * Sheet 1: Ledger Nilai (matrix: student × exam score)
   * Sheet 2: Belum Ujian (students with missing/unsubmitted exams per mapel)
   */
  async exportLedgerToExcel(groupId: string, res: Response) {
    const data = await this.getReportLedger(groupId);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CBT System';
    workbook.created = new Date();

    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' },
      },
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      },
    };

    /* ── Sheet 1: Ledger Nilai ── */
    const ws = workbook.addWorksheet('Ledger Nilai');

    const fixedCols: Partial<ExcelJS.Column>[] = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama Lengkap', key: 'fullName', width: 28 },
      { header: 'Username / NIS', key: 'username', width: 18 },
      { header: 'Kelas', key: 'rombel', width: 14 },
      { header: 'Jurusan', key: 'major', width: 16 },
    ];
    const examCols: Partial<ExcelJS.Column>[] = data.exams.map((e) => ({
      header: `${e.subject}\n(${e.title})`,
      key: `exam_${e.id}`,
      width: 18,
    }));
    const avgCol: Partial<ExcelJS.Column> = {
      header: 'Rata-rata\n(jika semua selesai)',
      key: 'average',
      width: 18,
    };

    ws.columns = [...fixedCols, ...examCols, avgCol];

    const headerRow = ws.getRow(1);
    headerRow.height = 44;
    ws.columns.forEach((_, colIdx) => {
      const cell = headerRow.getCell(colIdx + 1);
      cell.style = headerStyle;
    });

    data.ledger.forEach((student, idx) => {
      const rowData: Record<string, any> = {
        no: idx + 1,
        fullName: student.fullName,
        username: student.username,
        rombel: student.rombel?.name ?? '-',
        major: student.major?.name ?? '-',
        average: student.average !== null ? +student.average.toFixed(2) : '-',
      };
      for (const exam of data.exams) {
        const score = student.scores[exam.id];
        rowData[`exam_${exam.id}`] = score !== null ? score : '-';
      }
      const row = ws.addRow(rowData);
      row.height = 20;

      // Highlight missing per-exam cells red-tinted
      data.exams.forEach((exam, eIdx) => {
        if (student.scores[exam.id] === null) {
          const cell = row.getCell(fixedCols.length + eIdx + 1);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEF2F2' },
          };
          cell.font = { color: { argb: 'FFEF4444' } };
        }
      });
    });

    /* ── Sheet 2: Belum Ujian ── */
    const ws2 = workbook.addWorksheet('Belum Ujian');
    ws2.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama Lengkap', key: 'fullName', width: 28 },
      { header: 'Username', key: 'username', width: 18 },
      { header: 'Kelas', key: 'rombel', width: 14 },
      { header: 'Jurusan', key: 'major', width: 16 },
      {
        header: 'Mapel / Ujian Belum Dikerjakan',
        key: 'missingSubjects',
        width: 40,
      },
      { header: 'Status Sesi', key: 'status', width: 16 },
    ];

    const headerRow2 = ws2.getRow(1);
    headerRow2.height = 30;
    ws2.columns.forEach((_, colIdx) => {
      const cell = headerRow2.getCell(colIdx + 1);
      cell.style = headerStyle;
    });

    let rowNo = 1;
    data.unsubmitted.forEach((student) => {
      student.missingExams.forEach((missing, mIdx) => {
        const row = ws2.addRow({
          no: mIdx === 0 ? rowNo : '',
          fullName: mIdx === 0 ? student.fullName : '',
          username: mIdx === 0 ? student.username : '',
          rombel: mIdx === 0 ? (student.rombel?.name ?? '-') : '',
          major: mIdx === 0 ? (student.major?.name ?? '-') : '',
          missingSubjects: `${missing.subject} — ${missing.title}`,
          status: missing.status ?? 'NOT_STARTED',
        });
        row.height = 18;
      });
      rowNo++;
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ledger-${groupId}.xlsx"`,
    );

    await workbook.xlsx.write(res as any);
    res.end();
  }
}
