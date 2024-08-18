import { EmittedEvent } from 'src/enums/emitted-events.enum';

export type GameClientEmittedEvents = {
  [EmittedEvent.BUZZER_GRANTED]: () => void;
  [EmittedEvent.BUZZER_REVOKED]: () => void;
  [EmittedEvent.ROUND_STARTED]: () => void;
  [EmittedEvent.ROUND_ENDED]: () => void;
  [EmittedEvent.GAME_ENDED]: () => void;
};
