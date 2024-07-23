import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { GameClientService } from './game-client.service';
import { forwardRef, Inject, UseFilters, UseGuards } from '@nestjs/common';
import { JoinGameRequestDto } from 'src/dto/join-game-request.dto';
import { defaultValidationPipe } from 'src/pipes/default-validation.pipe';
import { AnswerRequestDto } from 'src/dto/answer-request.dto';
import { BuzzerGrantedGuard } from 'src/modules/game-client/guards/buzzer-granted.guard';
import { BuzzerAvailableGuard } from './guards/buzzer-available.guard';
import { SocketInRoomGuard } from '../../guards/socket-in-room.guard';
import { GameExistsGuard } from './guards/game-exists.guard';
import { AllowedGameStatus } from 'src/guards/allowed-game-status.decorator';
import { GameStatus } from 'src/enums/game-status.enum';
import { AllowedGameStatusGuard } from 'src/guards/allowed-game-status.guard';
import { WsExceptionsFilter } from 'src/ws-exception.filter';
import { GameClientEmittedEvents } from 'src/types/game-client-emitted-events.type';

@WebSocketGateway({
  namespace: 'game-client',
  cors: {
    origin: '*',
  },
})
@UseFilters(WsExceptionsFilter)
export class GameClientGateway implements OnGatewayDisconnect {
  @WebSocketServer() server: Server<GameClientEmittedEvents>;

  constructor(
    @Inject(forwardRef(() => GameClientService))
    private gameClientService: GameClientService,
  ) {}

  async handleDisconnect(client: Socket) {
    this.gameClientService.handlePlayerDisconnect(client.id);
  }

  @AllowedGameStatus(GameStatus.CREATED)
  @UseGuards(GameExistsGuard, AllowedGameStatusGuard)
  @SubscribeMessage('join-game')
  async handleJoinGame(
    @MessageBody(defaultValidationPipe)
    payload: JoinGameRequestDto,
    @ConnectedSocket() client: Socket,
  ): Promise<boolean> {
    await this.gameClientService.addUserToGame(payload, client.id);
    client.join(payload.gameId);
    return true;
  }

  @AllowedGameStatus(GameStatus.ROUND_IN_PROGRESS)
  @UseGuards(SocketInRoomGuard, AllowedGameStatusGuard, BuzzerAvailableGuard)
  @SubscribeMessage('buzzer')
  async handleBuzzer(@ConnectedSocket() client: Socket): Promise<boolean> {
    await this.gameClientService.handleBuzzerRequest(client.id);
    return true;
  }

  @AllowedGameStatus(GameStatus.ROUND_IN_PROGRESS)
  @UseGuards(SocketInRoomGuard, AllowedGameStatusGuard, BuzzerGrantedGuard)
  @SubscribeMessage('answer')
  async handleAnswer(
    @MessageBody(defaultValidationPipe)
    payload: AnswerRequestDto,
    @ConnectedSocket() client: Socket,
  ): Promise<boolean> {
    await this.gameClientService.handleAnswerRequest(payload, client.id);
    return true;
  }
}
