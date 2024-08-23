import { Inject, Injectable } from "@nestjs/common";
import axios from "axios";
import { SpotifyAuthResponse } from "../music-api/spotify.repository";
import { spotifyConfig } from "src/config/spotify.config";
import { ConfigType } from "@nestjs/config";
import * as querystring from 'querystring';
import { AccessToken } from "@spotify/web-api-ts-sdk";

@Injectable()
export class AuthService {
  constructor(@Inject(spotifyConfig.KEY)
  readonly config: ConfigType<typeof spotifyConfig>) {}

  loginSpotify(){
    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-collaborative'
      // Add other scopes as needed
    ];
    const url = `https://accounts.spotify.com/authorize?${querystring.stringify({
      response_type: 'code',
      client_id: this.config.clientId,
      scope: scopes.join(' '),
      redirect_uri: this.config.redirectUri,
      show_dialog: true
    })}`;
    return { url };
  }

  async getSpotifyTokens(code : string) : Promise<AccessToken>{
    const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', querystring.stringify({
      code,
      redirect_uri: this.config.redirectUri,
      grant_type: 'authorization_code',
    }), {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return tokenResponse.data;
  }
}