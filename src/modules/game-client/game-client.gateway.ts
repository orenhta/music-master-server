import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { GameClientService } from './game-client.service';
import { forwardRef, Inject, UseGuards } from '@nestjs/common';
import { JoinGameRequestDto } from 'src/dto/join-game-request.dto';
import { defaultValidationPipe } from 'src/pipes/default-validation.pipe';
import { AnswerRequestDto } from 'src/dto/answer-request.dto';
import { GameRelatedRequestDto } from 'src/dto/game-related-request.dto';
import { GameExistsGuard } from 'src/guards/game-exists.guard';
import { BuzzerGrantedGuard } from 'src/modules/game-client/guards/buzzer-granted.guard';
import { BuzzerAvailableGuard } from './guards/buzzer-available.guard';
import { PlayerInRoomGuard } from './guards/player-in-room.guard';

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

  @UseGuards(GameExistsGuard)
  @SubscribeMessage('join-game')
  async handleJoinGame(
    @MessageBody(defaultValidationPipe)
    payload: JoinGameRequestDto,
    @ConnectedSocket() client: Socket,
  ): Promise<boolean> {
    await this.gameHostService.addUserToGame(payload, client.id);
    client.join(payload.gameId);
    return true;
  }

  @UseGuards(GameExistsGuard, PlayerInRoomGuard, BuzzerAvailableGuard)
  @SubscribeMessage('buzzer')
  async handleBuzzer(
    @MessageBody(defaultValidationPipe)
    payload: GameRelatedRequestDto,
    @ConnectedSocket() client: Socket,
  ): Promise<boolean> {
    await this.gameHostService.handleBuzzerRequest(payload, client.id);
    return true;
  }

  @UseGuards(GameExistsGuard, PlayerInRoomGuard, BuzzerGrantedGuard)
  @SubscribeMessage('answer')
  async handleAnswer(
    @MessageBody(defaultValidationPipe)
    payload: AnswerRequestDto,
    @ConnectedSocket() client: Socket,
  ): Promise<boolean> {
    await this.gameHostService.handleAnswerRequest(payload, client.id);
    return true;
  }
}
