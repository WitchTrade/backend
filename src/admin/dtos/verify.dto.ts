import { IsString } from 'class-validator';

export class AdminVerifyDTO {
  @IsString()
  userId: string;
}