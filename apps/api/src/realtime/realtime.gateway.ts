import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Logger, Inject, forwardRef, OnModuleInit as NestOnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { appendFileSync, mkdirSync } from 'fs';
import path from 'path';

import { SessionStatus } from '@prisma/client';
import { ExamSessionsService } from '../exam-sessions/exam-sessions.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect, NestOnModuleInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('RealtimeGateway');
  private readonly auditLogPath = path.join(process.cwd(), 'apps', 'api', 'logs', 'log.txt');

  private writeAuditLog(message: string, meta: Record<string, any> = {}) {
    try {
      mkdirSync(path.dirname(this.auditLogPath), { recursive: true });
      appendFileSync(
        this.auditLogPath,
        `${new Date().toISOString()} ${message} ${JSON.stringify(meta)}\n`,
        'utf8',
      );
    } catch (error) {
      this.logger.error(`Failed to write audit log: ${message}`, error as any);
    }
  }

  private examSessionsService: ExamSessionsService;

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private moduleRef: ModuleRef,
  ) {}

  onModuleInit() {
    this.examSessionsService = this.moduleRef.get(ExamSessionsService, { strict: false });
  }

  sendToUser(userId: string, event: string, payload: any) {
    this.server.to(`user_${userId}`).emit(event, payload);
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const payload = this.jwtService.verify(token);
      client.data.user = payload;
      
      // Join a room based on their role/ID for targeted notifications
      client.join(`user_${payload.sub}`);
      this.logger.log(`Client connected: ${client.id}, User: ${payload.username} (${payload.role})`);
    } catch (e) {
      this.logger.warn(`Connection handshake rejected for client ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.user) {
      this.logger.log(`Client disconnected: ${client.id}, User: ${client.data.user.username}`);
      // Find which exams they were in and notify proctors
      // This is a bit simplified, in a large app you'd track active sessions
      this.server.emit('student_offline', {
        userId: client.data.user.sub,
        username: client.data.user.username,
        timestamp: new Date(),
      });
    } else {
      this.logger.log(`Client disconnected: ${client.id} (Unauthenticated)`);
    }
  }

  @SubscribeMessage('join_exam')
  async handleJoinExam(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { examId: string },
  ) {
    client.join(`exam_${data.examId}`);
    this.logger.log(`Student ${client.data.user.username} joined exam room ${data.examId}`);
    // Notify proctors that a student joined
    this.server.to(`proctor_${data.examId}`).emit('student_joined', {
      userId: client.data.user.sub,
      username: client.data.user.username,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('answer_changed')
  async handleAnswerChanged(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { examId: string, questionId: string, answer: any },
  ) {
    this.logger.log(`Student ${client.data.user.username} updated answer in exam ${data.examId} for question ${data.questionId}`);
    // Broadcast to proctors for real-time monitoring
    this.server.to(`proctor_${data.examId}`).emit('student_answer_update', {
      studentId: client.data.user.sub,
      questionId: data.questionId,
      answer: data.answer,
    });
  }

  @SubscribeMessage('question_changed')
  async handleQuestionChanged(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { examId: string, questionIndex: number },
  ) {
    this.logger.debug(`Student ${client.data.user.username} navigated to question index ${data.questionIndex} in exam ${data.examId}`);
    this.server.to(`proctor_${data.examId}`).emit('student_question_update', {
      studentId: client.data.user.sub,
      questionIndex: data.questionIndex,
    });
  }

  @SubscribeMessage('join_proctor')
  async handleJoinProctor(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { examId: string },
  ) {
    if (client.data.user.role === 'GURU' || client.data.user.role === 'SUPER_ADMIN') {
      client.join(`proctor_${data.examId}`);
      this.logger.log(`Proctor ${client.data.user.username} joined monitoring room proctor_${data.examId}`);
    }
  }

  @SubscribeMessage('violation_detected')
  async handleViolation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { examId: string, type: string, description: string },
  ) {
    this.logger.warn(`Violation detected for ${client.data.user.username} in exam ${data.examId}: [${data.type}] - ${data.description}`);
    // Save to database
    const student = await this.prisma.student.findUnique({
      where: { userId: client.data.user.sub }
    });

    if (student) {
      const session = await this.prisma.examSession.findUnique({
        where: {
          examId_studentId: {
            examId: data.examId,
            studentId: student.id,
          },
        },
      });

      if (session) {
        await this.prisma.violation.create({
          data: {
            examSessionId: session.id,
            type: data.type,
            description: data.description,
            level: 'RINGAN', // Default
          },
        });
      }
    }

    this.server.to(`proctor_${data.examId}`).emit('violation_alert', {
      studentId: client.data.user.sub,
      username: client.data.user.username,
      type: data.type,
      description: data.description,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('lock_student')
  async handleLockStudent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { examId: string, studentId: string },
  ) {
    if (client.data.user.role !== 'GURU' && client.data.user.role !== 'SUPER_ADMIN') {
      return;
    }

    const student = await this.prisma.student.findUnique({
      where: { userId: data.studentId },
    });
    if (!student) return;

    await this.prisma.examSession.update({
      where: {
        examId_studentId: {
          examId: data.examId,
          studentId: student.id,
        },
      },
      data: {
        status: SessionStatus.LOCKED,
      },
    });

    this.sendToUser(data.studentId, 'session_locked', { examId: data.examId });

    this.server.to(`proctor_${data.examId}`).emit('student_locked', {
      studentId: data.studentId,
    });
  }

  @SubscribeMessage('unlock_student')
  async handleUnlockStudent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { examId: string, studentId: string },
  ) {
    if (client.data.user.role !== 'GURU' && client.data.user.role !== 'SUPER_ADMIN') {
      return;
    }

    const student = await this.prisma.student.findUnique({
      where: { userId: data.studentId },
    });
    if (!student) return;

    await this.prisma.examSession.update({
      where: {
        examId_studentId: {
          examId: data.examId,
          studentId: student.id,
        },
      },
      data: {
        status: SessionStatus.IN_PROGRESS,
      },
    });

    this.sendToUser(data.studentId, 'session_unlocked', { examId: data.examId });

    this.server.to(`proctor_${data.examId}`).emit('student_unlocked', {
      studentId: data.studentId,
    });
  }

  @SubscribeMessage('force_submit_student')
  async handleForceSubmitStudent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { examId: string, studentId: string },
  ) {
    if (client.data.user.role !== 'GURU' && client.data.user.role !== 'SUPER_ADMIN') {
      return;
    }

    const student = await this.prisma.student.findUnique({
      where: { userId: data.studentId },
    });
    if (!student) return;

    const session = await this.prisma.examSession.findUnique({
      where: {
        examId_studentId: {
          examId: data.examId,
          studentId: student.id,
        },
      },
    });
    if (!session) return;

    await this.examSessionsService.finishSession(session.id);

    this.sendToUser(data.studentId, 'session_submitted', { examId: data.examId });

    this.server.to(`proctor_${data.examId}`).emit('student_submitted', {
      studentId: data.studentId,
    });
  }

  @SubscribeMessage('add_student_time')
  async handleAddStudentTime(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { examId: string, studentId: string, minutes: number },
  ) {
    console.info('[realtime:add_student_time] received', {
      examId: data.examId,
      studentId: data.studentId,
      minutes: data.minutes,
      role: client.data.user.role,
    });

    if (client.data.user.role !== 'GURU' && client.data.user.role !== 'SUPER_ADMIN') {
      console.warn('[realtime:add_student_time] rejected: unauthorized role', {
        role: client.data.user.role,
        examId: data.examId,
        studentId: data.studentId,
      });
      return;
    }

    const student = await this.prisma.student.findUnique({
      where: { userId: data.studentId },
    });
    if (!student) {
      console.warn('[realtime:add_student_time] student not found', {
        examId: data.examId,
        studentId: data.studentId,
      });
      return;
    }

    const session = await this.prisma.examSession.findUnique({
      where: {
        examId_studentId: {
          examId: data.examId,
          studentId: student.id,
        },
      },
    });
    if (!session) {
      this.writeAuditLog('[realtime:add_student_time] session not found', {
        examId: data.examId,
        studentId: data.studentId,
        internalStudentId: student.id,
      });
      return;
    }

    const currentEndTime = session.endTime ? new Date(session.endTime) : new Date();
    const newEndTime = new Date(currentEndTime.getTime() + data.minutes * 60 * 1000);
    const newEndTimeIso = newEndTime.toISOString();

    await this.prisma.examSession.update({
      where: { id: session.id },
      data: { endTime: newEndTime },
    });

    const updatedSession = await this.prisma.examSession.findUnique({
      where: {
        id: session.id,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    const payload = {
      examId: data.examId,
      studentId: data.studentId,
      addedMinutes: data.minutes,
      newEndTime: newEndTimeIso,
      sessionId: updatedSession?.id || session.id,
      status: updatedSession?.status || session.status,
      endTime: updatedSession?.endTime ? new Date(updatedSession.endTime).toISOString() : newEndTimeIso,
      lastActiveAt: updatedSession?.lastActiveAt ? new Date(updatedSession.lastActiveAt).toISOString() : undefined,
    };

    this.writeAuditLog('[realtime:add_student_time] updated', {
      examId: data.examId,
      studentId: data.studentId,
      sessionId: payload.sessionId,
      newEndTime: payload.newEndTime,
      storedEndTime: payload.endTime,
      addedMinutes: payload.addedMinutes,
    });

    // Notify the student
    this.sendToUser(data.studentId, 'time_added', payload);
    console.info('[realtime:add_student_time] emitted time_added to student', {
      examId: data.examId,
      studentId: data.studentId,
    });

    // Notify the exam room so the active student client can also consume the event
    this.server.to(`exam_${data.examId}`).emit('student_time_added', payload);
    console.info('[realtime:add_student_time] emitted student_time_added to exam room', {
      examId: data.examId,
      studentId: data.studentId,
    });

    // Notify the proctor room
    this.server.to(`proctor_${data.examId}`).emit('student_time_added', payload);
    console.info('[realtime:add_student_time] emitted student_time_added to proctor room', {
      examId: data.examId,
      studentId: data.studentId,
    });
  }
}
