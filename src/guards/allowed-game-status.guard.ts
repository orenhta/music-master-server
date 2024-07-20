import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WsException } from '@nestjs/websockets';
import { GameStatus } from 'src/enums/game-status.enum';
import { GameStateRepository } from 'src/modules/game-state/game-state.repository';
import { Socket } from 'socket.io';
import { GameRelatedRequestDto } from 'src/dto/game-related-request.dto';

@Injectable()
export class AllowedGameStatusGuard implements CanActivate {
  constructor(
    private gameStateRepository: GameStateRepository,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext) {
    const socket = context.switchToWs().getClient<Socket>();
    const payload = context
      .switchToWs()
      .getData<Partial<GameRelatedRequestDto>>();
    const gameId =
      payload?.gameId ??
      (await this.gameStateRepository.getGameIdBySocketId(socket.id));

    const allowedGameStatuses: GameStatus[] =
      this.reflector.get<GameStatus[]>(
        'AllowedGameStatuses',
        context.getHandler(),
      ) ?? [];

    const gameState = await this.gameStateRepository.getGameState(gameId);

    if (!allowedGameStatuses.includes(gameState.gameStatus)) {
      throw new WsException(
        `Operation '${context.switchToWs().getPattern()}' is only available when game status in ${allowedGameStatuses}`,
      );
    }
    return true;
  }
}
