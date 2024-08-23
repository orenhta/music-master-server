import { Playlist } from './playlist.type';

export type PlaylistsResponse = {
  top: Playlist[];
  master: Playlist[];
};
