import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { AnswerRequest } from 'src/types/answer-request.type';
import { BuzzerRequest } from 'src/types/buzzer-request.type';
import { JoinRoomRequest } from 'src/types/join-game.type';
import { GameClientService } from './game-client.service';
import { forwardRef, Inject } from '@nestjs/common';

@WebSocketGateway({
  namespace: 'game-client',
  cors: {
    origin: '*',
  },
})
export class GameClientGateway {
  @WebSocketServer() server: Server;

  constructor(
    @Inject(forwardRef(() => GameClientService))
    private gameHostService: GameClientService,
  ) {}

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @MessageBody()
    payload: JoinRoomRequest,
    @ConnectedSocket() client: Socket,
  ): Promise<boolean> {
    await this.gameHostService.addUserToRoom(payload, client.id);
    client.join(payload.gameId);
    return true;
  }

  @SubscribeMessage('buzzer')
  async handleBuzzer(
    @MessageBody()
    payload: BuzzerRequest,
    @ConnectedSocket() client: Socket,
  ): Promise<boolean> {
    await this.gameHostService.handleBuzzerRequest(payload, client.id);
    return true;
  }

  @SubscribeMessage('answer')
  async handleAnswer(
    @MessageBody()
    payload: AnswerRequest,
    @ConnectedSocket() client: Socket,
  ): Promise<boolean> {
    await this.gameHostService.handleAnswerRequest(payload, client.id);
    return true;
  }
}
