import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { GameStateRepository } from 'src/modules/game-state/game-state.repository';
import { GameRelatedRequestDto } from 'src/dto/game-related-request.dto';

@Injectable()
export class BuzzerAvailableGuard implements CanActivate {
  constructor(private gameStateRepository: GameStateRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const payload = context.switchToWs().getData<GameRelatedRequestDto>();
    const gameState = await this.gameStateRepository.getGameState(
      payload.gameId,
    );
    const currentGuessingPlayer = gameState.currentGuessingPlayer;
    return !currentGuessingPlayer;
  }
}
