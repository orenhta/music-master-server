import { EndRoundPlayerRespnse } from "src/types/end-round-response.type";
import { GameState, RoundData } from "src/types/game-state.type";

export const gameStateToEndRoundScore =(
    gameState: GameState
  ): EndRoundPlayerRespnse[] => {
    console.log(gameState.gamePlayers)
    console.log(gameState.roundData)
    return Object.values(gameState.gamePlayers).map((player) => ({
        ...player,
        gainedScore: (gameState.roundData as RoundData)
        .scores[player.userName] ?? 0,
      }))
  };