import { GameStatus } from 'src/enums/game-status.enum';
import type { Player } from './player.type';
import { Song } from './song.type';

export type RoundData = {
  currentCorrectAnswer: Song;
};

export type RoundInProgressData = RoundData & {
  roundStartedAt: number;
  artistGuessedBy: string | null;
  songGuessedBy: string | null;
  currentGuessingPlayer: string | null;
  buzzersGranted: string[];
  buzzerGrantedAt: number | null;
};

type RoundDataByGameStatus = {
  [GameStatus.PENDING_ROUND_START]: RoundData;
  [GameStatus.ROUND_IN_PROGRESS]: RoundInProgressData;
};

export type GameState<T extends GameStatus = GameStatus> = {
  gameId: string;
  gameSecret: string;
  gameStatus: T;
  gameHost: string;
  gamePlayers: Record<string, Player>;
  streak?: {
    player: string;
    multiplier: number;
  };
  totalRounds: number;
  round: number;
  roundData: T extends keyof RoundDataByGameStatus
    ? RoundDataByGameStatus[T]
    : Record<never, never>;
};
