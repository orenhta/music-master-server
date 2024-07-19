import { Module } from '@nestjs/common';
import { GameManagerGateway } from './game-manager.gateway';
import { GameManagerService } from './game-manager.service';
import { GameStateModule } from 'src/game-state/game-state.module';
import { GameClientModule } from 'src/game-client/game-client.module';

@Module({
  imports: [GameStateModule, GameClientModule],
  providers: [GameManagerGateway, GameManagerService],
})
export class GameManagerModule {}
