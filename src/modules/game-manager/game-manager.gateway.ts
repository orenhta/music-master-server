import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { GameCreationResponse } from 'src/types/game-creation-response';
import { GameManagerService } from './game-manager.service';
import { GameRelatedRequestDto } from 'src/dto/game-related-request.dto';
import { defaultValidationPipe } from 'src/pipes/default-validation.pipe';
import { GameExistsGuard } from 'src/guards/game-exists.guard';
import { UseGuards } from '@nestjs/common';
import { GameHostGuard } from './guards/game-host.guard';

@WebSocketGateway({
  namespace: 'game-manager',
  cors: {
    origin: '*',
  },
})
@WebSocketGateway()
export class GameManagerGateway {
  @WebSocketServer() server: Server;

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

  @UseGuards(GameExistsGuard, GameHostGuard)
  @SubscribeMessage('next-round')
  async handleNextRound(
    @MessageBody(defaultValidationPipe)
    payload: GameRelatedRequestDto,
  ): Promise<boolean> {
    await this.gameManagerService.nextRound(payload);
    return true;
  }

  @UseGuards(GameExistsGuard, GameHostGuard)
  @SubscribeMessage('end-round')
  async handleEndRound(
    @MessageBody(defaultValidationPipe)
    payload: GameRelatedRequestDto,
  ): Promise<boolean> {
    await this.gameManagerService.endRound(payload);
    return true;
  }

  @UseGuards(GameExistsGuard, GameHostGuard)
  @SubscribeMessage('end-game')
  async handleEndGame(
    @MessageBody(defaultValidationPipe)
    payload: GameRelatedRequestDto,
  ): Promise<boolean> {
    await this.gameManagerService.endGame(payload);
    return true;
  }
}
