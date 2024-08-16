import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { GameState } from 'src/types/game-state.type';
import { EndRoundResponse } from 'src/types/end-round-response.type';
import { GameCreationResponse } from 'src/types/game-creation-response';
import { GameStateRepository } from 'src/modules/game-state/game-state.repository';
import { GameClientGateway } from 'src/modules/game-client/game-client.gateway';
import { GameStatus } from 'src/enums/game-status.enum';
import { EndGameResponse } from 'src/types/end-game-response.type';
import { WsException } from '@nestjs/websockets';
import { NextRoundResponse } from 'src/types/next-round-response.type';
import { EmittedEvent } from 'src/enums/emitted-events.enum';
import { RejoinGameRequestDto } from 'src/dto/rejoin-game-request.dto';
import { v4 as uuid } from 'uuid';
import { MusicApiService } from '../music-api/music-api.service';
import { MaxInt } from '@spotify/web-api-ts-sdk';
import { GameSettingsDto } from 'src/dto/game-settings.dto';

@Injectable()
export class GameManagerService {
  constructor(
    @Inject(forwardRef(() => GameClientGateway))
    private gameClientGateway: GameClientGateway,
    private readonly gameStateRepository: GameStateRepository,
    private readonly musicApiService: MusicApiService,
  ) {}

  async getTopPlaylists(){
    return await this.musicApiService.getTopPlaylists();
  }

  async getMasterPlaylists(){
    return await this.musicApiService.getMasterPlaylists();
  }

  async createGame(socketId: string, gameSettings : GameSettingsDto): Promise<GameCreationResponse> {
    if (await this.gameStateRepository.getGameIdBySocketId(socketId)) {
      throw new WsException('host is already in a game');
    }

    const gameId = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');

    const gameIdExists =
      !!(await this.gameStateRepository.getGameState(gameId));

    if (gameIdExists) {
      throw new WsException('gameId already exists');
    }
    const songs = await this.musicApiService.getSongsByClientPlaylist(
      gameSettings.totalRounds as MaxInt<100>,
      gameSettings.playlistId
    );

    const newGameState: GameState = {
      gameId,
      gameSecret: uuid(),
      gameHost: socketId,
      gameStatus: GameStatus.CREATED,
      round: 0,
      gamePlayers: {},
      totalRounds : gameSettings.totalRounds,
      songs,
      roundData: {},
    };

    this.gameStateRepository.saveGameState(newGameState, true);

    return {
      gameId: newGameState.gameId,
      gameSecret: newGameState.gameSecret,
    };
  }

  async rejoinGame(
    rejoinGameRequest: RejoinGameRequestDto,
    socketId: string,
  ): Promise<GameState> {
    const gameState = await this.gameStateRepository.getGameState(
      rejoinGameRequest.gameId,
    );

    if (gameState.gameSecret !== rejoinGameRequest.gameSecret) {
      throw new WsException('Invalid game secret');
    }

    const isHostConnected =
      !!(await this.gameStateRepository.getGameIdBySocketId(
        gameState.gameHost,
      ));

    if (!isHostConnected) {
      throw new WsException('Host is still connected');
    }

    const newGameState: GameState = {
      ...gameState,
      gameHost: socketId,
      gameSecret: uuid(),
    };

    await this.gameStateRepository.saveGameState(newGameState, true);

    return newGameState;
  }

  async nextRound(socketId: string): Promise<NextRoundResponse> {
    const gameId = await this.gameStateRepository.getGameIdBySocketId(socketId);
    const gameState = await this.gameStateRepository.getGameState<
      GameStatus.ROUND_ENDED | GameStatus.CREATED
    >(gameId);

    if (gameState.round === gameState.totalRounds) {
      throw new WsException('No more rounds');
    }

    const nextRound = gameState.round + 1;
    const song = gameState.songs[nextRound - 1];

    const nextRoundResponse: NextRoundResponse = {
      round: nextRound,
      previewUrl: song.previewUrl,
    };

    await this.gameStateRepository.saveGameState({
      ...gameState,
      gameStatus: GameStatus.PENDING_ROUND_START,
      round: nextRoundResponse.round,
      roundData: {
        ...gameState.roundData,
      },
    });

    return nextRoundResponse;
  }

  async startRound(socketId: string): Promise<void> {
    const gameId = await this.gameStateRepository.getGameIdBySocketId(socketId);
    const gameState =
      await this.gameStateRepository.getGameState<GameStatus.PENDING_ROUND_START>(
        gameId,
      );

    if (gameState.gameStatus !== GameStatus.PENDING_ROUND_START) {
      throw new WsException('Round not pending start');
    }

    await this.gameStateRepository.saveGameState({
      ...gameState,
      gameStatus: GameStatus.ROUND_IN_PROGRESS,
      roundData: {
        ...gameState.roundData,
        currentGuessingPlayer: null,
        roundStartedAt: Date.now(),
        artistGuessedBy: null,
        songGuessedBy: null,
        buzzersGranted: [],
        buzzerGrantedAt: null,
      },
    });

    this.gameClientGateway.server.in(gameId).emit(EmittedEvent.ROUND_STARTED);
  }

  async endRound(socketId: string): Promise<EndRoundResponse> {
    const gameId = await this.gameStateRepository.getGameIdBySocketId(socketId);
    const gameState =
      await this.gameStateRepository.getGameState<GameStatus.ROUND_IN_PROGRESS>(
        gameId,
      );

    const correctAnswer = gameState.songs[gameState.round - 1];

    await this.gameStateRepository.saveGameState({
      ...gameState,
      gameStatus: GameStatus.ROUND_ENDED,
      roundData: {},
    });

    this.gameClientGateway.server.in(gameId).emit(EmittedEvent.ROUND_ENDED);

    return {
      songGuessedBy: gameState.roundData.songGuessedBy,
      artistGuessedBy: gameState.roundData.artistGuessedBy,
      correctAnswer,
      scores: Object.values(gameState.gamePlayers),
    };
  }

  async endGame(socketId: string): Promise<EndGameResponse> {
    const gameId = await this.gameStateRepository.getGameIdBySocketId(socketId);
    const gameState =
      await this.gameStateRepository.getGameState<GameStatus.ROUND_IN_PROGRESS>(
        gameId,
      );

    await this.gameStateRepository.deleteGameState(gameId);

    this.gameClientGateway.server.in(gameId).emit(EmittedEvent.GAME_ENDED);
    this.gameClientGateway.server.in(gameId).socketsLeave(gameId);

    return {
      scores: Object.values(gameState.gamePlayers),
    };
  }

  async handleHostDisconnect(socketId: string): Promise<void> {
    const gameId = await this.gameStateRepository.getGameIdBySocketId(socketId);
    if (!gameId) {
      await this.gameStateRepository.removeSocket(socketId);
      return;
    }

    setTimeout(async () => {
      const gameState = await this.gameStateRepository.getGameState(gameId);
      if (gameState.gameHost === socketId) {
        await this.endGame(socketId);
      }
      await this.gameStateRepository.removeSocket(socketId);
    }, 15_000);
  }
}
