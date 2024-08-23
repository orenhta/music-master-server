import { registerAs } from '@nestjs/config';
import { Genre } from 'src/enums/genre.enum';

export const spotifyConfig = registerAs('spotifyConfig', () => {
  const playlistIdByGenre: Record<Genre, string> = {
    [Genre.POP]: '3ZgmfR6lsnCwdffZUan8EA',
    [Genre.ROCK]: '3qu74M0PqlkSV76f98aqTd',
    [Genre.HIP_HOP]: '37i9dQZF1DXb8wplbC2YhV',
    [Genre.ELECTRONIC]: '1zsMB814a8VhwohGe2ZTpd',
    [Genre.TOP_HITS]: '5ABHKGoOzxkaa28ttQV9sE',
    [Genre.EIGHTIES]: '37i9dQZF1DXb57FjYWz00c',
  };
  return {
    clientId: process.env.SPOTIFY_CLIENT_ID!,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
    playlistIdByGenre,
  };
});
