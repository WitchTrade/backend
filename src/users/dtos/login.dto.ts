import { IsString } from 'class-validator';

export class UserLoginDTO {
  @IsString()
  username: string;

  @IsString()
  password: string;
}
