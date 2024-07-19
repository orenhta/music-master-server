import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { GameRelatedRequestDto } from 'src/dto/game-related-request.dto';
import { GameStateRepository } from 'src/modules/game-state/game-state.repository';

@Injectable()
export class GameHostGuard implements CanActivate {
  constructor(private gameStateRepository: GameStateRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const socket = context.switchToWs().getClient();
    const payload = context.switchToWs().getData<GameRelatedRequestDto>();
    const gameState = await this.gameStateRepository.getGameState(
      payload.gameId,
    );
    const gameHost = gameState.gameHost;
    return socket.id === gameHost;
  }
}
