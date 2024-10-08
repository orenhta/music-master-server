import { Injectable } from '@nestjs/common';
import { SpotifyRepository } from './spotify.repository';
import { FeaturedPlaylists, MaxInt } from '@spotify/web-api-ts-sdk';
import { Song } from 'src/types/song.type';

@Injectable()
export class MusicApiService {
  constructor(private readonly spotifyRepository: SpotifyRepository) {}

  async getTopPlaylists(): Promise<FeaturedPlaylists> {
    return this.spotifyRepository.getTopPlaylists();
  }

  async getMasterPlaylists() {
    return this.spotifyRepository.getMasterPlaylists();
  }

  async getSongsByPlaylistId(
    amount: MaxInt<100>,
    playlistId: string,
  ): Promise<Song[]> {
    return this.spotifyRepository.getSongsByPlaylistId(amount, playlistId);
  }
}
