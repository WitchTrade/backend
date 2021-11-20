import { IsString } from 'class-validator';

export class UserRefreshDTO {
  @IsString()
  token: string;

  @IsString()
  refreshToken: string;
}
