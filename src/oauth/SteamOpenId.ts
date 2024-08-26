import 'dotenv/config';
import { RelyingParty } from 'openid';

export class SteamOpenId {
  private _relyingParty: RelyingParty;

  private _steamOpenIdRegex =
    /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/;

  constructor() {
    this._relyingParty = new RelyingParty(
      process.env.OAUTH_RETURNURL,
      process.env.STEAM_OPENID_REALM,
      true,
      true,
      [],
    );
  }

  async getRedirectUrl(): Promise<string> {
    return new Promise((resolve) => {
      this._relyingParty.authenticate(
        'https://steamcommunity.com/openid',
        false,
        (error, authUrl) => {
          resolve(authUrl);
        },
      );
    });
  }

  async authenticate(url: string): Promise<string> {
    return new Promise((resolve) => {
      this._relyingParty.verifyAssertion(url, async (error, result) => {
        if (!result) {
          resolve(null);
        }

        const steamId = result.claimedIdentifier.match(
          this._steamOpenIdRegex,
        )[1];

        return resolve(steamId);
      });
    });
  }
}
