import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { GameStateRepository } from 'src/modules/game-state/game-state.repository';
import { WsException } from '@nestjs/websockets';
import { GameStatus } from 'src/enums/game-status.enum';
import { Socket } from 'socket.io';
import { last as arrayLast } from 'lodash';

@Injectable()
export class BuzzerAvailableGuard implements CanActivate {
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

    if (
      !gameState.gameSettings.isBuzzerTwiceAllowed &&
      socket.id !== arrayLast(gameState.roundData.buzzersGranted)
    ) {
      throw new WsException('Player cannot take buzzer twice');
    }

    if (currentGuessingPlayer) {
      throw new WsException('Other player is guessing');
    }

    return true;
  }
}
