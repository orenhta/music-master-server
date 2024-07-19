import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { GameState } from 'src/types/game-state.type';
import { EndRoundResponse } from 'src/types/end-round-response.type';
import { GameCreationResponse } from 'src/types/game-creation-response';
import { GameStateRepository } from 'src/modules/game-state/game-state.repository';
import { GameClientGateway } from 'src/modules/game-client/game-client.gateway';
import { songsById } from 'src/songs/songs';
import { GameRelatedRequestDto } from 'src/dto/game-related-request.dto';
import { GameStatus } from 'src/enums/game-status.enum';
import { RoundData } from 'src/types/round-data.type';
import { EndGameResponse } from 'src/types/end-game-response.type';

@Injectable()
export class GameManagerService {
  constructor(
    @Inject(forwardRef(() => GameClientGateway))
    private gameClientGateway: GameClientGateway,
    private readonly gameStateRepository: GameStateRepository,
  ) {}

  async createGame(socketId: string): Promise<GameCreationResponse> {
    const newGameState: GameState = {
      gameId: Math.floor(10000 + Math.random() * 90000).toString(),
      gameHost: socketId,
      gameStatus: GameStatus.CREATED,
      round: 0,
      totalRounds: Object.keys(songsById).length,
      gamePlayers: [],
      buzzersGranted: [],
      currentGuessingPlayer: null,
      currentCorrectAnswer: null,
      roundStartedAt: null,
    };

    this.gameStateRepository.saveGameState(newGameState);

    return {
      gameId: newGameState.gameId,
    };
  }

  async nextRound(gameHostRequest: GameRelatedRequestDto): Promise<RoundData> {
    const gameState = await this.gameStateRepository.getGameState(
      gameHostRequest.gameId,
    );

    if (
      !(
        gameState.gameStatus === GameStatus.ROUND_ENDED ||
        gameState.gameStatus === GameStatus.CREATED
      )
    ) {
      throw new BadRequestException('Round not ended');
    }

    if (gameState.round === gameState.totalRounds) {
      throw new BadRequestException('No more rounds');
    }

    const nextRound = gameState.round + 1;
    const song = songsById[nextRound];

    const roundData: RoundData = {
      round: nextRound,
      songId: nextRound,
    };

    await this.gameStateRepository.saveGameState({
      ...gameState,
      gameStatus: GameStatus.PENDING_ROUND_START,
      round: roundData.round,
      currentCorrectAnswer: song.title,
    });

    return roundData;
  }

  async startRound(gameHostRequest: GameRelatedRequestDto): Promise<void> {
    const gameState = await this.gameStateRepository.getGameState(
      gameHostRequest.gameId,
    );

    if (gameState.gameStatus !== GameStatus.PENDING_ROUND_START) {
      throw new BadRequestException('Round not pending start');
    }

    await this.gameStateRepository.saveGameState({
      ...gameState,
      gameStatus: GameStatus.ROUND_IN_PROGRESS,
      roundStartedAt: Date.now(),
    });

    this.gameClientGateway.server
      .in(gameHostRequest.gameId)
      .emit('round-started');
  }

  async endRound(
    gameHostRequest: GameRelatedRequestDto,
  ): Promise<EndRoundResponse> {
    const gameState = await this.gameStateRepository.getGameState(
      gameHostRequest.gameId,
    );

    await this.gameStateRepository.saveGameState({
      ...gameState,
      gameStatus: GameStatus.ROUND_ENDED,
      currentGuessingPlayer: null,
    });

    this.gameClientGateway.server
      .in(gameHostRequest.gameId)
      .emit('round-ended');

    return {
      guessedBy: null,
      correctAnswer: gameState.currentCorrectAnswer ?? '',
      scores: gameState.gamePlayers.map(({ id: _, ...player }) => player),
    };
  }

  async endGame(
    gameHostRequest: GameRelatedRequestDto,
  ): Promise<EndGameResponse> {
    const { guessedBy: _, ...endGameResponse } =
      await this.endRound(gameHostRequest);
    await this.gameStateRepository.deleteGameState(gameHostRequest.gameId);

    this.gameClientGateway.server.in(gameHostRequest.gameId).emit('game-ended');
    this.gameClientGateway.server
      .in(gameHostRequest.gameId)
      .socketsLeave(gameHostRequest.gameId);
    return endGameResponse;
  }
}
