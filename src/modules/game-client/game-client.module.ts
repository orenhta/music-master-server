import { forwardRef, Module } from '@nestjs/common';
import { GameStateModule } from 'src/modules/game-state/game-state.module';
import { GameClientGateway } from './game-client.gateway';
import { GameClientService } from './game-client.service';
import { GameManagerModule } from '../game-manager/game-manager.module';
import { ScoreService } from './score.service';
import { AnswerValidatorService } from './answer-validator.service';

@Module({
  imports: [GameStateModule, forwardRef(() => GameManagerModule)],
  providers: [
    GameClientGateway,
    GameClientService,
    ScoreService,
    AnswerValidatorService,
  ],
  exports: [GameClientGateway],
})
export class GameClientModule {}
