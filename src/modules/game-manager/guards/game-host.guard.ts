import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { GameRelatedRequestDto } from 'src/dto/game-related-request.dto';
import { GameStateRepository } from 'src/modules/game-state/game-state.repository';
import { Socket } from 'socket.io';

@Injectable()
export class GameHostGuard implements CanActivate {
  constructor(private gameStateRepository: GameStateRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const socket = context.switchToWs().getClient<Socket>();
    const payload = context
      .switchToWs()
      .getData<Partial<GameRelatedRequestDto>>();
    const gameState = await this.gameStateRepository.getGameState(
      payload?.gameId ?? '',
    );
    const gameHost = gameState.gameHost;
    if (socket.id !== gameHost) {
      throw 'not game host';
    }
    return true;
  }
}
