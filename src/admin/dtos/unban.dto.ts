import { IsString } from 'class-validator';

export class AdminUnbanDTO {
  @IsString()
  userId: string;
}