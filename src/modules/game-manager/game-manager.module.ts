import { forwardRef, Module } from '@nestjs/common';
import { GameManagerGateway } from './game-manager.gateway';
import { GameManagerService } from './game-manager.service';
import { GameStateModule } from 'src/modules/game-state/game-state.module';
import { GameClientModule } from 'src/modules/game-client/game-client.module';
import { MusicApiModule } from '../music-api/music-api.module';
import { GameMangerController } from './game-manager.controller';

@Module({
  imports: [
    MusicApiModule,
    GameStateModule,
    forwardRef(() => GameClientModule),
  ],
  controllers : [GameMangerController],
  providers: [GameManagerGateway, GameManagerService],
  exports: [GameManagerGateway],
})
export class GameManagerModule {}
