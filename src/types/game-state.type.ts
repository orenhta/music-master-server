import { GameStatus } from 'src/enums/game-status.enum';
import type { Player } from './player.type';

export type GameState = {
  gameId: string;
  gameStatus: GameStatus;
  gameHost: string;
  round: number;
  totalRounds: number;
  gamePlayers: Player[];
  buzzersGranted: Player['id'][];
  currentCorrectAnswer: string | null;
  currentGuessingPlayer: string | null;
  roundStartedAt: number | null;
};
