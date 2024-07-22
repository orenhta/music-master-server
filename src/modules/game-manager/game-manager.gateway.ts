import {
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { GameCreationResponse } from 'src/types/game-creation-response';
import { GameManagerService } from './game-manager.service';
import { UseFilters, UseGuards } from '@nestjs/common';
import { EndRoundResponse } from 'src/types/end-round-response.type';
import { EndGameResponse } from 'src/types/end-game-response.type';
import { GameStatus } from 'src/enums/game-status.enum';
import { AllowedGameStatus } from 'src/guards/allowed-game-status.decorator';
import { NextRoundResponse } from 'src/types/next-round-response.type';
import { AllowedGameStatusGuard } from 'src/guards/allowed-game-status.guard';
import { WsExceptionsFilter } from 'src/ws-exception.filter';
import { SocketInRoomGuard } from 'src/guards/socket-in-room.guard';
import { GameHostEmittedEvents } from 'src/types/game-host-emitted-events.type';

@WebSocketGateway({
  namespace: 'game-manager',
  cors: {
    origin: '*',
  },
})
@UseFilters(WsExceptionsFilter)
export class GameManagerGateway {
  @WebSocketServer() server: Server<GameHostEmittedEvents>;

  constructor(private gameManagerService: GameManagerService) {}

  @SubscribeMessage('create-game')
  async handleCreateGame(
    @ConnectedSocket() client: Socket,
  ): Promise<GameCreationResponse> {
    const gameCreationResponse = await this.gameManagerService.createGame(
      client.id,
    );

    return gameCreationResponse;
  }

  @AllowedGameStatus(GameStatus.CREATED, GameStatus.ROUND_ENDED)
  @UseGuards(SocketInRoomGuard, AllowedGameStatusGuard)
  @SubscribeMessage('next-round')
  async handleNextRound(
    @ConnectedSocket() client: Socket,
  ): Promise<NextRoundResponse> {
    return await this.gameManagerService.nextRound(client.id);
  }

  @AllowedGameStatus(GameStatus.PENDING_ROUND_START)
  @UseGuards(SocketInRoomGuard, AllowedGameStatusGuard)
  @SubscribeMessage('start-round')
  async handleStartRound(@ConnectedSocket() client: Socket): Promise<boolean> {
    await this.gameManagerService.startRound(client.id);
    return true;
  }

  @AllowedGameStatus(GameStatus.ROUND_IN_PROGRESS)
  @UseGuards(SocketInRoomGuard, AllowedGameStatusGuard)
  @SubscribeMessage('end-round')
  async handleEndRound(
    @ConnectedSocket() client: Socket,
  ): Promise<EndRoundResponse> {
    return await this.gameManagerService.endRound(client.id);
  }

  @UseGuards(SocketInRoomGuard)
  @SubscribeMessage('end-game')
  async handleEndGame(
    @ConnectedSocket() client: Socket,
  ): Promise<EndGameResponse> {
    return await this.gameManagerService.endGame(client.id);
  }
}
