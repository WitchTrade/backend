import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UserUpdateDTO {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @MaxLength(20)
  displayName: string;

  @IsOptional()
  @IsString()
  @Matches(
    /^(?:https?:\/\/)?steamcommunity\.com\/(?:profiles|id)\/[a-zA-Z0-9\-._~]+\/?$/,
    {
      message: 'Not a valid steam profile link',
    },
  )
  steamProfileLink: string;

  @IsOptional()
  @IsString()
  discordTag: string;

  @IsBoolean()
  hidden: boolean;
}
