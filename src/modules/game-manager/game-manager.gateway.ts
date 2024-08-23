import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
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
import { GameExistsGuard } from '../game-client/guards/game-exists.guard';
import { GameState } from 'src/types/game-state.type';
import { defaultValidationPipe } from 'src/pipes/default-validation.pipe';
import { RejoinGameRequestDto } from 'src/dto/rejoin-game-request.dto';
import { CreateGameRequestDto } from 'src/dto/create-game-request.dto';
import { PlaylistsResponse } from 'src/types/playlists-response';
import { spotifyPlaylistToPlaylist } from 'src/functions/as-dtos';

@WebSocketGateway({
  namespace: 'game-manager',
  cors: {
    origin: '*',
  },
})
@UseFilters(WsExceptionsFilter)
export class GameManagerGateway implements OnGatewayDisconnect {
  @WebSocketServer() server: Server<GameHostEmittedEvents>;

  constructor(private gameManagerService: GameManagerService) {}

  handleDisconnect(client: Socket) {
    this.gameManagerService.handleHostDisconnect(client.id);
  }

  @SubscribeMessage('create-game')
  async handleCreateGame(
    @MessageBody(defaultValidationPipe)
    payload: CreateGameRequestDto,
    @ConnectedSocket() client: Socket,
  ): Promise<GameCreationResponse> {
    const gameCreationResponse = await this.gameManagerService.createGame(
      client.id,
      payload,
    );

    return gameCreationResponse;
  }

  @SubscribeMessage('get-available-playlists')
  async handlePrepareGame(): Promise<PlaylistsResponse> {
    const masterPlaylists = await this.gameManagerService.getMasterPlaylists();
    const topPlaylists = await this.gameManagerService.getTopPlaylists();

    return {
      top: topPlaylists.playlists.items.map(spotifyPlaylistToPlaylist),
      master: masterPlaylists.map(spotifyPlaylistToPlaylist),
    };
  }

  @UseGuards(GameExistsGuard)
  @SubscribeMessage('rejoin-game')
  async handleRejoinGame(
    @MessageBody(defaultValidationPipe)
    payload: RejoinGameRequestDto,
    @ConnectedSocket() client: Socket,
  ): Promise<GameState> {
    const gameCreationResponse = await this.gameManagerService.rejoinGame(
      payload,
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
