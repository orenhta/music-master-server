import { Module } from '@nestjs/common';
import { MusicApiService } from './music-api.service';
import { SpotifyRepository } from './spotify.repository';
import { ConfigModule } from '@nestjs/config';
import { spotifyConfig } from 'src/config/spotify.config';

@Module({
  imports: [ConfigModule.forFeature(spotifyConfig)],
  providers: [MusicApiService, SpotifyRepository],
  exports: [MusicApiService],
})
export class MusicApiModule {}
