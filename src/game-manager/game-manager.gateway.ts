import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { GameCreationResponse } from 'src/types/game-creation-response';
import { GameHostRequest } from 'src/types/game-host-request';
import { GameManagerService } from './game-manager.service';

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

  @SubscribeMessage('next-round')
  async handleNextRound(
    @MessageBody()
    payload: GameHostRequest,
    @ConnectedSocket() client: Socket,
  ): Promise<boolean> {
    await this.gameManagerService.nextRound(payload, client.id);
    return true;
  }

  @SubscribeMessage('end-round')
  async handleEndRound(
    @MessageBody()
    payload: GameHostRequest,
    @ConnectedSocket() client: Socket,
  ): Promise<boolean> {
    await this.gameManagerService.endRound(payload, client.id);
    return true;
  }

  @SubscribeMessage('end-game')
  async handleEndGame(
    @MessageBody()
    payload: GameHostRequest,
    @ConnectedSocket() client: Socket,
  ): Promise<boolean> {
    await this.gameManagerService.endGame(payload, client.id);
    return true;
  }
}
