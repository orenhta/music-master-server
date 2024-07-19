import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { GameStateRepository } from 'src/modules/game-state/game-state.repository';
import { GameRelatedRequestDto } from 'src/dto/game-related-request.dto';
import { Socket } from 'socket.io';

@Injectable()
export class PlayerInRoomGuard implements CanActivate {
  constructor(private gameStateRepository: GameStateRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const socket = context.switchToWs().getClient<Socket>();
    const payload = context
      .switchToWs()
      .getData<Partial<GameRelatedRequestDto>>();
    const gameState = await this.gameStateRepository.getGameState(
      payload?.gameId ?? '',
    );
    const isPlayerInGame = gameState.gamePlayers.some(
      (player) => player.id === socket.id,
    );
    if (!isPlayerInGame) {
      throw new UnauthorizedException('Player not in game');
    }
    return true;
  }
}
