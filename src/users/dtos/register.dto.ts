import { IsEmail, IsString, Matches, MaxLength } from 'class-validator';

export class UserRegisterDTO {
  @IsString()
  @Matches(/^(?=.{4,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/, {
    message: 'Invalid username',
  })
  username: string;

  @IsString()
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/, {
    message:
      'Password must be at least 8 characters long, contain at least 1 letter and 1 number',
  })
  password: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @MaxLength(20)
  displayName: string;
}
