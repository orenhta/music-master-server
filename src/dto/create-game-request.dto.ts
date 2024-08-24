import { MaxInt } from '@spotify/web-api-ts-sdk';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateGameRequestDto {
  @IsBoolean()
  isTimeBasedScore: boolean;

  @IsBoolean()
  isPunishmentScoreAllowed: boolean;

  @IsBoolean()
  isBuzzerTwiceAllowed: boolean;

  @IsNumber()
  @IsInt()
  @Min(0)
  @Max(30)
  totalRounds: MaxInt<30>;

  @IsString()
  @Length(22)
  playlistId: string;
}
