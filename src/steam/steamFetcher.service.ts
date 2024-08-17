import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SteamFetcherService {
  constructor(private _httpService: HttpService) {}

  public async getSteamProfileId(steamUrl: string): Promise<string> {
    let steamProfileId: string;

    const steamUrlUsernameRegex = steamUrl.match(
      /^https:\/\/steamcommunity\.com\/id\/([^/]+).*$/,
    );
    if (steamUrlUsernameRegex) {
      const steamUsername = steamUrlUsernameRegex[1];
      const response = await firstValueFrom(
        this._httpService.get<any>(
          `http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${process.env.STEAMAPIKEY}&vanityurl=${steamUsername}`,
        ),
      );
      if (response.status === 200 && response.data.response.success === 1) {
        steamProfileId = response.data.response.steamid;
      } else {
        throw new HttpException(
          `Steam profile not found. Please check your configured Steam profile in the account settings.`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const steamUrlIdRegex = steamUrl.match(
      /^https:\/\/steamcommunity\.com\/profiles\/([^/]+).*$/,
    );
    if (steamUrlIdRegex) {
      steamProfileId = steamUrlIdRegex[1];
    }

    if (!steamProfileId) {
      throw new HttpException(
        `Steam profile not found. Please check your configured Steam profile in the account settings.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return steamProfileId;
  }
}
