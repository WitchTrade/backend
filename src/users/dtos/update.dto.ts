import { IsBoolean, IsEmail, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UserUpdateDTO {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @MaxLength(20)
  displayName: string;

  @IsOptional()
  @IsString()
  @Matches(/^(?:https?:\/\/)?steamcommunity\.com\/(?:profiles|id)\/[a-zA-Z0-9\-._~]+\/?$/, {
    message: 'Not a valid steam profile link'
  })
  steamProfileLink: string;

  @IsOptional()
  @IsString()
  @Matches(/^(?:https?:\/\/)?steamcommunity\.com\/tradeoffer\/new\/[a-zA-Z0-9?=&-]+$/, {
    message: 'Not a valid steam trade link'
  })
  steamTradeLink: string;

  @IsOptional()
  @IsString()
  @Matches(/^.{3,32}#[0-9]{4}$/)
  discordTag: string;

  @IsBoolean()
  usingSteamGuard: boolean;

  @IsBoolean()
  hidden: boolean;
}
