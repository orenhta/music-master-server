import { Module } from '@nestjs/common';
import { GameStateRepository } from './game-state.repository';

@Module({
  providers: [GameStateRepository],
  exports: [GameStateRepository],
})
export class GameStateModule {}
