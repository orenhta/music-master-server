import { EmittedEvents } from 'src/enums/emitted-events.enum';

export type GameClientEmittedEvents = {
  [EmittedEvents.BUZZER_GRANTED]: () => void;
  [EmittedEvents.BUZZER_REVOKED]: () => void;
  [EmittedEvents.ROUND_STARTED]: () => void;
  [EmittedEvents.ROUND_ENDED]: () => void;
  [EmittedEvents.GAME_ENDED]: () => void;
};
