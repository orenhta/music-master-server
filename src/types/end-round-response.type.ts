import type { Player } from './player.type';
import { Song } from './song.type';

export type EndRoundPlayerResponse = Player & { gainedScore: number };

export type EndRoundResponse = {
  songGuessedBy: string | null;
  artistGuessedBy: string | null;
  correctAnswer: Song;
  scores: EndRoundPlayerResponse[];
};
