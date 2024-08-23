import { Controller, Get, Query, Redirect, Res } from "@nestjs/common";
import { GameManagerService } from "./game-manager.service";
import { FeaturedPlaylists } from "@spotify/web-api-ts-sdk";
import { Response } from 'express';
import { Cookies } from "src/functions/cookies-extract";

@Controller('game-manager')
export class GameMangerController {

    constructor(private gameManagerService: GameManagerService) {}

    // @Get('/top-playlists')
    // async getPlaylists() : Promise<GetPlaylistDto[]> {
    //     const res = await this.gameManagerService.getTopPlaylists()
    //     return res.playlists.items.map(playlist => ({id : playlist.id,image : playlist.images[0].url, title : playlist.name}))
    // }

    // @Get('/master-playlists')
    // async getMasterPlaylists() : Promise<GetPlaylistDto[]> {
    //     const res = await this.gameManagerService.getMasterPlaylists();
    //     return res.map(playlist => ({id : playlist.id,image : playlist.images[0].url, title : playlist.name}));
    // }

    // @Get('/my-playlists')
    // async getMyPlaylists(@Cookies('spotify_access_token') accessToken: string, @Cookies('spotify_refresh_token') refreshToken: string) : Promise<GetPlaylistDto[]> {
    //     const res = await this.gameManagerService.getMyPlaylists(accessToken, refreshToken);
    //     return res.items.map(playlist => ({id : playlist.id,image : playlist.images[0].url, title : playlist.name}));
    // }
}