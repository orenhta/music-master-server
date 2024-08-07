import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { GameStateRepository } from 'src/modules/game-state/game-state.repository';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { GameStatus } from 'src/enums/game-status.enum';

@Injectable()
export class BuzzerGrantedGuard implements CanActivate {
  constructor(private gameStateRepository: GameStateRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const socket = context.switchToWs().getClient<Socket>();
    const gameId = await this.gameStateRepository.getGameIdBySocketId(
      socket.id,
    );
    const gameState =
      await this.gameStateRepository.getGameState<GameStatus.ROUND_IN_PROGRESS>(
        gameId,
      );

    const currentGuessingPlayer = gameState.roundData.currentGuessingPlayer;
    if (socket.id !== currentGuessingPlayer) {
      throw new WsException('Buzzer not granted');
    }
    return true;
  }
}
