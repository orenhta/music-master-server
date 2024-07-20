import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { GameStateRepository } from 'src/modules/game-state/game-state.repository';
import { Socket } from 'socket.io';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class SocketInRoomGuard implements CanActivate {
  constructor(private gameStateRepository: GameStateRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const socket = context.switchToWs().getClient<Socket>();
    const gameId = await this.gameStateRepository.getGameIdBySocketId(
      socket.id,
    );

    if (!gameId) {
      throw new WsException('Socket not in room');
    }

    return true;
  }
}
