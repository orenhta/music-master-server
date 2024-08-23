import { Controller, Get, Query, Redirect, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Response } from 'express';
import { SpotifyApi } from "@spotify/web-api-ts-sdk";

@Controller('auth')
export class AuthController {

    constructor(private authService: AuthService) {}

  @Get('spotify-login')
  @Redirect()
    login() {
    return  this.authService.loginSpotify();
  }

  @Get('spotify-login/callback')
  async callback(@Query('code') code: string, @Res() res: Response) {
    const tokens = await this.authService.getSpotifyTokens(code);
    console.log(tokens)
    const resff = await SpotifyApi.withAccessToken(this.authService.config.clientId,tokens).currentUser.playlists.playlists(50)
    console.log(resff)
    res.cookie('spotify_access_token',tokens.access_token,{
        httpOnly: true, // Prevents JavaScript access to the cookie
      //  secure: process.env.NODE_ENV === 'production', // Send only over HTTPS in production
        maxAge: 3600 * 1000, // Cookie expires after 1 hour (3600 seconds)
        sameSite: 'lax',
    })

    res.cookie('spotify_refresh_token',tokens.refresh_token,{
        httpOnly: true, // Prevents JavaScript access to the cookie
      //  secure: process.env.NODE_ENV === 'production', // Send only over HTTPS in production
        maxAge: 3600 * 1000, // Cookie expires after 1 hour (3600 seconds)
        sameSite: 'lax',
    })

    res.redirect(process.env.FRONT_PATH!);
}
}