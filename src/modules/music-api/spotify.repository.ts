import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { MaxInt, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { spotifyConfig } from 'src/config/spotify.config';
import { Genre } from 'src/enums/genre.enum';
import { Song } from 'src/types/song.type';

@Injectable()
export class SpotifyRepository {
  private readonly spotify: SpotifyApi;
  private readonly playlistIdByGenre: Record<Genre, string>;

  constructor(
    @Inject(spotifyConfig.KEY)
    readonly config: ConfigType<typeof spotifyConfig>,
  ) {
    this.spotify = SpotifyApi.withClientCredentials(
      config.clientId,
      config.clientSecret,
    );
    this.playlistIdByGenre = config.playlistIdByGenre;
  }

  getSongsByGenre(amount: MaxInt<100>, genre: Genre): Promise<Song[]> {
    return this.getSongsByPlaylistId(amount, this.playlistIdByGenre[genre]);
  }

  async getSongsByPlaylistId(
    amount: MaxInt<100>,
    playlistId: string,
  ): Promise<Song[]> {
    const data = await this.spotify.playlists.getPlaylistItems(
      playlistId,
      undefined,
      undefined,
      // Although sdk limit is 50, their api allows up to 100
      100 as MaxInt<50>,
    );

    return data.items
      .sort(() => Math.random() - 0.5)
      .filter(
        (a) =>
          a?.track?.preview_url &&
          a?.track?.name?.match(/^[^(]+/)?.[0] &&
          a?.track?.artists[0]?.name?.match(/^[^(]+/)?.[0],
      )
      .slice(0, amount)
      .map(({ track }) => ({
        title: track.name
          .match(/^[^(]+/)![0]
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .trim(),
        artist: track.artists[0].name
          .match(/^[^(]+/)![0]
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .trim(),
        previewUrl: track.preview_url!,
        albumCoverUrl: track.album?.images?.[0]?.url,
      }));
  }
}