import { Injectable } from '@nestjs/common';
import { SpotifyRepository } from './spotify.repository';
import { MaxInt } from '@spotify/web-api-ts-sdk';
import { Song } from 'src/types/song.type';
import { Genre } from 'src/enums/genre.enum';

@Injectable()
export class MusicApiService {
  constructor(private readonly spotifyRepository: SpotifyRepository) {}

  async getSongsByGenre(amount: MaxInt<100>, genre: Genre): Promise<Song[]> {
    return await this.spotifyRepository.getSongsByGenre(amount, genre);
  }

  async getSongsByClientPlaylistUrl(
    amount: MaxInt<100>,
    playlistUrl: string,
  ): Promise<Song[]> {
    return await this.spotifyRepository.getSongsByPlaylistUrl(
      amount,
      playlistUrl,
    );
  }
}
