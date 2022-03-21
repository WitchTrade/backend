import { IsString } from 'class-validator';

export class AdminRoleDTO {
  @IsString()
  userId: string;

  @IsString()
  roleId: string;
}
