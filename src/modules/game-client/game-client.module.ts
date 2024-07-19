import { forwardRef, Module } from '@nestjs/common';
import { GameStateModule } from 'src/modules/game-state/game-state.module';
import { GameClientGateway } from './game-client.gateway';
import { GameClientService } from './game-client.service';
import { GameManagerModule } from '../game-manager/game-manager.module';

@Module({
  imports: [GameStateModule, forwardRef(() => GameManagerModule)],
  providers: [GameClientGateway, GameClientService],
  exports: [GameClientGateway],
})
export class GameClientModule {}
