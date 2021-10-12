import { IsString } from 'class-validator';

export class AdminBadgeDTO {
  @IsString()
  userId: string;

  @IsString()
  badgeId: string;
}