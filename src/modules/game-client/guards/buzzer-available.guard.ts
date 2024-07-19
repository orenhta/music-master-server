import {
  BadRequestException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { GameStateRepository } from 'src/modules/game-state/game-state.repository';
import { GameRelatedRequestDto } from 'src/dto/game-related-request.dto';
import { GameStatus } from 'src/enums/game-status.enum';

@Injectable()
export class BuzzerAvailableGuard implements CanActivate {
  constructor(private gameStateRepository: GameStateRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const payload = context
      .switchToWs()
      .getData<Partial<GameRelatedRequestDto>>();

    const gameState = await this.gameStateRepository.getGameState(
      payload?.gameId ?? '',
    );
    const currentGuessingPlayer = gameState.currentGuessingPlayer;

    if (currentGuessingPlayer) {
      throw new BadRequestException('Other player is guessing');
    }

    if (gameState.gameStatus !== GameStatus.ROUND_IN_PROGRESS) {
      throw new BadRequestException('Round is not in progress');
    }

    return true;
  }
}
