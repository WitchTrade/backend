import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { catchError, EMPTY, firstValueFrom } from 'rxjs';
import { SteamInventoryResponse } from './models/steamInventoryResponse.model';

@Injectable()
export class SteamFetcherService {
  constructor(private _httpService: HttpService) {}

  public async getSteamProfileId(
    steamUrl: string,
    autoSync?: boolean,
    failed?: any,
  ): Promise<string> {
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
        if (autoSync) {
          failed(response.status === 200);
          return;
        }
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
      if (autoSync) {
        failed(true);
        return;
      }
      throw new HttpException(
        `Steam profile not found. Please check your configured Steam profile in the account settings.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return steamProfileId;
  }

  public async fetchInventoryPage(
    steamProfileId: string,
    lastAssedId?: string,
    autoSync?: boolean,
    failed?: any,
  ) {
    return firstValueFrom(
      this._httpService
        .get<SteamInventoryResponse>(
          `https://steamcommunity.com/inventory/${steamProfileId}/559650/2?l=english&count=5000${
            lastAssedId ? `&start_assetid=${lastAssedId}` : ''
          }`,
          {
            headers: {
              'User-Agent': process.env.USER_AGENT,
              Referer: `https://steamcommunity.com/inventory/${steamProfileId}/559650/2?l=english&count=5000${
                lastAssedId ? `&start_assetid=${lastAssedId}` : ''
              }`,
            },
          },
        )
        .pipe(
          catchError((e) => {
            if (autoSync) {
              failed(e.response.status === 403);
              return EMPTY;
            } else {
              if (e.response.status === 403) {
                throw new HttpException(
                  `Your steam inventory is not public. witchtrade.org can't access it.`,
                  HttpStatus.BAD_REQUEST,
                );
              } else if (e.response.status === 429) {
                console.log(
                  `429 by ${steamProfileId} at ${new Date().toISOString()}`,
                );
                throw new HttpException(
                  `Steam rate limit reached, please try again later.`,
                  HttpStatus.BAD_REQUEST,
                );
              } else {
                throw new HttpException(e.response.data, e.response.status);
              }
            }
          }),
        ),
    );
  }

  public async getSteamFriendIds(steamId: string) {
    return firstValueFrom(
      this._httpService
        .get<any>(
          `https://api.steampowered.com/ISteamUser/GetFriendList/v1/?key=${process.env.STEAMAPIKEY}&steamid=${steamId}&relationship=friend`,
        )
        .pipe(
          catchError((e) => {
            if (e.response.status === 401) {
              throw new HttpException(
                `Your steam friend list is private. witchtrade.org can't access it.`,
                HttpStatus.BAD_REQUEST,
              );
            }
            throw new HttpException(e.response.data, e.response.status);
          }),
        ),
    );
  }

  public async getSteamNamesfromIds(steamIds: string[]) {
    return firstValueFrom(
      this._httpService
        .get<any>(
          `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${
            process.env.STEAMAPIKEY
          }&steamids=${steamIds.join(',')}`,
        )
        .pipe(
          catchError((e) => {
            throw new HttpException(e.response.data, e.response.status);
          }),
        ),
    );
  }
}
