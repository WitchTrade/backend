import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
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
  discordTag: string;

  @IsBoolean()
  hidden: boolean;
}
