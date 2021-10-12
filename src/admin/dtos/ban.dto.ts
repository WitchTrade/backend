import { IsString } from 'class-validator';

export class AdminBanDTO {
  @IsString()
  userId: string;

  @IsString()
  reason: string;
}