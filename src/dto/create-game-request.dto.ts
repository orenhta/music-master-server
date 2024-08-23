import { MaxInt } from '@spotify/web-api-ts-sdk';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { SPOTIFY_PLAYLIST_URL_REGEX } from 'src/constants/constants';
import { Genre } from 'src/enums/genre.enum';

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
  playlistId: string

  // @IsUrl()
  // @Matches(SPOTIFY_PLAYLIST_URL_REGEX)
  // @ValidateIf((o) => !o.genre || o.playlistUrl)
  // playlistUrl?: string;

  // @IsEnum(Genre)
  // @ValidateIf((o) => !o.playlistUrl || o.genre)
  // genre?: Genre;
}
