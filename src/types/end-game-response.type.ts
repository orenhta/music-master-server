import { EndRoundResponse } from './end-round-response.type';

export type EndGameResponse = Omit<EndRoundResponse, 'guessedBy'>;
