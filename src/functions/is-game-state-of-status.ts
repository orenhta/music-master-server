import { GameStatus } from 'src/enums/game-status.enum';
import { GameState } from 'src/types/game-state.type';

export const isGameStateOfStatus = <T extends GameStatus>(
  gameState: GameState,
  gameStatus: T,
): gameState is GameState<T> => {
  return gameState.gameStatus === gameStatus;
};
