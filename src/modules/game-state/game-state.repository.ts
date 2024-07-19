import { Injectable } from '@nestjs/common';
import { GameState } from 'src/types/game-state.type';
import { JoinRoomRequest } from 'src/types/join-game.type';

@Injectable()
export class GameStateRepository {
  private gameStates: Record<string, GameState> = {};

  async saveGameState(newGameState: GameState) {
    this.gameStates[newGameState.gameId] = newGameState;
  }

  async getGameState(gameId: string): Promise<GameState> {
    return this.gameStates[gameId];
  }

  async addUserToRoom(joinGameRequest: JoinRoomRequest, socketId: string) {
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
