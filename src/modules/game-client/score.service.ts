import { Injectable } from '@nestjs/common';

const TIME_RELATIVE_GUESS_START_MS = 3_000;
const TIME_RELATIVE_GUESS_END_MS = 30_000;

@Injectable()
export class ScoreService {
  constructor() {}

  getScoreForAnswer(
    isArtistCorrect: boolean,
    isTitleCorrect: boolean,
    streak: number,
    roundStartedAt: number,
    buzzerGrantedAt: number,
    isTimeBasedScore: boolean,
    isPunishmentScoreAllowed: boolean,
  ): number {
    if (!(isArtistCorrect || isTitleCorrect)) {
      return isPunishmentScoreAllowed
        ? this.getTimeBasedPunishmentScore(buzzerGrantedAt, roundStartedAt)
        : 0;
    }

    const baseScore = this.getBaseScore(isArtistCorrect, isTitleCorrect);
    const timeMultiplier = isTimeBasedScore
      ? this.getTimeMultiplier(buzzerGrantedAt, roundStartedAt)
      : 1;

    return Math.round(Number((baseScore * timeMultiplier * streak).toFixed(2)));
  }

  getTimeBasedPunishmentScore(
    buzzerTime: number,
    roundStartedAt: number,
  ): number {
    const punishmentScore =
      buzzerTime - roundStartedAt < TIME_RELATIVE_GUESS_START_MS
        ? -20
        : buzzerTime - roundStartedAt > TIME_RELATIVE_GUESS_END_MS
          ? -5
          : -10;
    return Math.round(punishmentScore);
  }

  private getBaseScore(
    isArtistCorrect: boolean,
    isTitleCorrect: boolean,
  ): number {
    if (isArtistCorrect && isTitleCorrect) return 100;
    if (isTitleCorrect) return 60;
    if (isArtistCorrect) return 30;

    return 0;
  }

  private getTimeMultiplier(
    buzzerTime: number,
    roundStartedAt: number,
  ): number {
    return buzzerTime - roundStartedAt < TIME_RELATIVE_GUESS_START_MS
      ? 1
      : buzzerTime - roundStartedAt > TIME_RELATIVE_GUESS_END_MS
        ? 0.5
        : 1 -
          (buzzerTime - roundStartedAt) /
            (TIME_RELATIVE_GUESS_END_MS - TIME_RELATIVE_GUESS_START_MS) /
            2;
  }
}
