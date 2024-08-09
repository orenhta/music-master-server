import { Injectable } from '@nestjs/common';
import { Song } from 'src/types/song.type';
import { distance } from 'fastest-levenshtein';

const GUESS_MAX_DISTANCE_THRESHOLD = 2;

@Injectable()
export class AnswerValidatorService {
  constructor() {}

  validateAnswer(
    guess: string,
    correctAnswer: Song,
    isArtistGuessed: boolean,
    isTitleGuessed: boolean,
  ): {
    isArtistCorrect: boolean;
    isTitleCorrect: boolean;
  } {
    let isArtistCorrect = false;
    let isTitleCorrect = false;

    if (
      !isArtistGuessed &&
      this.getDistance(correctAnswer.artist, guess) <=
        GUESS_MAX_DISTANCE_THRESHOLD
    ) {
      isArtistCorrect = true;
    }

    if (
      !isTitleGuessed &&
      this.getDistance(correctAnswer.title, guess) <=
        GUESS_MAX_DISTANCE_THRESHOLD
    ) {
      isTitleCorrect = true;
    }

    return {
      isArtistCorrect,
      isTitleCorrect,
    };
  }

  private getDistance(correctAnswer: string, guess: string): number {
    return Math.min(
      ...this.generateWordSubstrings(guess).map((substring) =>
        distance(correctAnswer.toLowerCase(), substring.toLowerCase()),
      ),
    );
  }

  private generateWordSubstrings(inputString: string): string[] {
    const words = inputString.split(' ');
    const substrings = [];

    for (let start = 0; start < words.length; start++) {
      let substring = '';
      for (let end = start; end < words.length; end++) {
        if (substring) {
          substring += ' ';
        }
        substring += words[end];
        substrings.push(substring);
      }
    }

    return substrings;
  }
}
