import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { Inject } from '@nestjs/core';
import { REQUEST } from '@nestjs/core';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class RealtimeService {}
