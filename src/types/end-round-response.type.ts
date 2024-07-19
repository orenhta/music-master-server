import type { Player } from './player.type';

export type EndRoundResponse = {
  guessedBy: string | null;
  correctAnswer: string;
  scores: Omit<Player, 'id'>[];
};
