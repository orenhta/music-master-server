import type { Player } from './player.type';

export type EndRoundResponse = {
  correctAnswer: string;
  scores: Omit<Player, 'id'>[];
};
