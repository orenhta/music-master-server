import { GameStatus } from 'src/enums/game-status.enum';
import type { Player } from './player.type';
import { Song } from './song.type';

export type RoundData = {
  roundStartedAt: number;
  artistGuessedBy: Player['userName'] | null;
  songGuessedBy: Player['userName'] | null;
  currentGuessingPlayer: string | null;
  buzzersGranted: string[];
  buzzerGrantedAt: number | null;
  scores: Record<Player['userName'], number>;
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
  gameSettings: GameSettings;
};

export type GameSettings = {
  isTimeBasedScore: boolean;
  isPunishmentScoreAllowed: boolean;
  isBuzzerTwiceAllowed: boolean;
};
