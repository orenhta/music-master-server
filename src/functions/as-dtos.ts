import { SimplifiedPlaylist, Playlist as SpotifyPlaylist, Track } from "@spotify/web-api-ts-sdk";
import { Playlist } from "src/types/playlist.type";

export const spotifyPlaylistToPlaylist = (spotifyPlaylist : SimplifiedPlaylist) : Playlist => ({id : spotifyPlaylist.id, image : spotifyPlaylist.images[0].url,title : spotifyPlaylist.name})