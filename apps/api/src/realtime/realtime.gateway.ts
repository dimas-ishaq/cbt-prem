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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const payload = this.jwtService.verify(token);
      client.data.user = payload;
      
      // Join a room based on their role/ID for targeted notifications
      client.join(`user_${payload.sub}`);
      console.log(`Client connected: ${client.id}, User: ${payload.username}`);
    } catch (e) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    if (client.data.user) {
      // Find which exams they were in and notify proctors
      // This is a bit simplified, in a large app you'd track active sessions
      this.server.emit('student_offline', {
        userId: client.data.user.sub,
        username: client.data.user.username,
        timestamp: new Date(),
      });
    }
  }

  @SubscribeMessage('join_exam')
  async handleJoinExam(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { examId: string },
  ) {
    client.join(`exam_${data.examId}`);
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
    // Broadcast to proctors for real-time monitoring
    this.server.to(`proctor_${data.examId}`).emit('student_answer_update', {
      studentId: client.data.user.sub,
      questionId: data.questionId,
      answer: data.answer,
    });
  }

  @SubscribeMessage('join_proctor')
  async handleJoinProctor(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { examId: string },
  ) {
    if (client.data.user.role === 'GURU' || client.data.user.role === 'SUPER_ADMIN') {
      client.join(`proctor_${data.examId}`);
      console.log(`Proctor joined: ${client.id}, Exam: ${data.examId}`);
    }
  }

  @SubscribeMessage('violation_detected')
  async handleViolation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { examId: string, type: string, description: string },
  ) {
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
}
