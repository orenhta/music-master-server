import { Injectable } from '@nestjs/common';
import { JoinGameRequestDto } from 'src/dto/join-game-request.dto';
import { GameStatus } from 'src/enums/game-status.enum';
import { GameState } from 'src/types/game-state.type';

@Injectable()
export class GameStateRepository {
  private gameStates: Record<string, GameState> = {};
  private gameIdBySocketId: Record<string, string> = {};

  async saveGameState<T extends GameStatus>(newGameState: GameState<T>) {
    if (!this.gameStates[newGameState.gameId]) {
      this.gameIdBySocketId[newGameState.gameHost] = newGameState.gameId;
    }
    this.gameStates[newGameState.gameId] = newGameState;
  }

  async getGameState<T extends GameStatus = GameStatus>(
    gameId: string,
  ): Promise<GameState<T>> {
    return this.gameStates[gameId] as GameState<T>;
  }

  async getGameIdBySocketId(socketId: string): Promise<string> {
    return this.gameIdBySocketId[socketId];
  }

  async addUserToGame(joinGameRequest: JoinGameRequestDto, socketId: string) {
    this.gameStates[joinGameRequest.gameId].gamePlayers.push({
      id: socketId,
      userName: joinGameRequest.playerName,
      score: 0,
    });
    this.gameIdBySocketId[socketId] = joinGameRequest.gameId;
  }

  async deleteGameState(gameId: string) {
    delete this.gameStates[gameId];
    this.gameIdBySocketId = Object.fromEntries(
      Object.entries(this.gameIdBySocketId).filter(
        ([_, value]) => value !== gameId,
      ),
    );
  }
}
