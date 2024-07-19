import { Injectable } from '@nestjs/common';
import { JoinGameRequestDto } from 'src/dto/join-game-request.dto';
import { GameState } from 'src/types/game-state.type';

@Injectable()
export class GameStateRepository {
  private gameStates: Record<string, GameState> = {};

  async saveGameState(newGameState: GameState) {
    this.gameStates[newGameState.gameId] = newGameState;
  }

  async getGameState(gameId: string): Promise<GameState> {
    return this.gameStates[gameId];
  }

  async addUserToGame(joinGameRequest: JoinGameRequestDto, socketId: string) {
    this.gameStates[joinGameRequest.gameId].gamePlayers.push({
      id: socketId,
      userName: joinGameRequest.playerName,
      score: 0,
    });
  }

  async deleteGameState(gameId: string) {
    delete this.gameStates[gameId];
  }
}
