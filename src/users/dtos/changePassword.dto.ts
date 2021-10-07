import { IsString, Matches } from 'class-validator';

export class UserChangePasswordDTO {
    @IsString()
    oldPassword: string;

    @IsString()
    @Matches(/^(?=.*[a-z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/, {
        message: 'Password must be at least 8 characters long, contain at least 1 letter and 1 number'
    })
    password: string;
}