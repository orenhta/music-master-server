import { GameStatus } from 'src/enums/game-status.enum';
import type { Player } from './player.type';
import { Song } from './song.type';

export type RoundData = {
  roundStartedAt: number;
  artistGuessedBy: string | null;
  songGuessedBy: string | null;
  currentGuessingPlayer: string | null;
  buzzersGranted: string[];
  buzzerGrantedAt: number | null;
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
  songs: Song[];
  roundData: T extends GameStatus.ROUND_IN_PROGRESS
    ? RoundData
    : Record<never, never>;
  isTimeBasedScore: boolean;
  isPunishmentScoreAllowed: boolean;
  allowBuzzerTwice: boolean;
};
