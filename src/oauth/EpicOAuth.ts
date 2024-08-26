import { AccessToken, AuthorizationCode, ModuleOptions } from 'simple-oauth2';

const config: ModuleOptions = {
  client: {
    id: process.env.EPIC_CLIENT_ID,
    secret: process.env.EPIC_CLIENT_SECRET,
  },
  auth: {
    authorizeHost: 'https://www.epicgames.com',
    authorizePath: '/id/authorize',
    tokenHost: 'https://api.epicgames.dev',
    tokenPath: '/epic/oauth/v2/token',
  },
};

export class EpicOAuth {
  private _client: AuthorizationCode;
  constructor() {
    this._client = new AuthorizationCode(config);
  }

  async getRedirectUrl(): Promise<string> {
    const authorizationUri = this._client.authorizeURL({
      redirect_uri: process.env.OAUTH_RETURNURL,
      scope: 'basic_profile',
    });

    return authorizationUri;
  }

  async authenticate(url: string): Promise<string> {
    const code = new URL(url).searchParams.get('code');
    const tokenParams = {
      grant_type: 'authorization_code',
      scope: 'basic_profile',
      redirect_uri: process.env.OAUTH_RETURNURL,
      code,
    };

    let accessToken: AccessToken & { account_id: string };
    try {
      accessToken = await (
        await fetch('https://api.epicgames.dev/epic/oauth/v2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(
              `${process.env.EPIC_CLIENT_ID}:${process.env.EPIC_CLIENT_SECRET}`,
            ).toString('base64')}`,
          },
          body: new URLSearchParams(tokenParams),
        })
      ).json();
    } catch (error) {
      console.log('Access Token Error', error.message);
    }

    return accessToken?.account_id;
  }
}
