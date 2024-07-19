import type { Player } from './player.type';

export type GameState = {
  gameId: string;
  gameHost: string;
  round: number;
  gamePlayers: Player[];
  currentCorrectAnswer: string | null;
  currentGuessingPlayer: string | null;
};
