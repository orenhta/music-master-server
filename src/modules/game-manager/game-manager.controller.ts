import { Controller, Get } from "@nestjs/common";
import { GameManagerService } from "./game-manager.service";
import { FeaturedPlaylists } from "@spotify/web-api-ts-sdk";

interface GetPlaylistDto {
    id : string,
    image : string,
    title : string
}
  

@Controller('game-manager')
export class GameMangerController {

    constructor(private gameManagerService: GameManagerService) {}
    @Get('/top-playlists')
    async getPlaylists() : Promise<GetPlaylistDto[]> {
        const res = await this.gameManagerService.getTopPlaylists()
        return res.playlists.items.map(playlist => ({id : playlist.id,image : playlist.images[0].url, title : playlist.name}))
    }

    @Get('/master-playlists')
    async getMasterPlaylists() : Promise<GetPlaylistDto[]> {
        const res = await this.gameManagerService.getMasterPlaylists();
        return res.map(playlist => ({id : playlist.id,image : playlist.images[0].url, title : playlist.name}));
    }
}