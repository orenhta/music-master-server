import type { Player } from './player.type';
import { Song } from './song.type';

export type EndRoundResponse = {
  songGuessedBy: string | null;
  artistGuessedBy: string | null;
  correctAnswer: Song;
  scores: EndRoundPlayerRespnse[];
};

export type EndRoundPlayerRespnse = Player & { gainedScore: number };
