import { Module } from '@nestjs/common';
import { GameStateModule } from 'src/modules/game-state/game-state.module';
import { GameClientGateway } from './game-client.gateway';
import { GameClientService } from './game-client.service';

@Module({
  imports: [GameStateModule],
  providers: [GameClientGateway, GameClientService],
  exports: [GameClientGateway],
})
export class GameClientModule {}
