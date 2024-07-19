import { forwardRef, Module } from '@nestjs/common';
import { GameManagerGateway } from './game-manager.gateway';
import { GameManagerService } from './game-manager.service';
import { GameStateModule } from 'src/modules/game-state/game-state.module';
import { GameClientModule } from 'src/modules/game-client/game-client.module';

@Module({
  imports: [GameStateModule, forwardRef(() => GameClientModule)],
  providers: [GameManagerGateway, GameManagerService],
  exports: [GameManagerGateway],
})
export class GameManagerModule {}
