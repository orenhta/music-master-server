import { EndRoundResponse } from './end-round-response.type';

export type EndGameResponse = Pick<EndRoundResponse, 'scores'>;
