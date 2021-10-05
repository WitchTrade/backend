import { IsEmail, IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class UserRegisterDTO {
    @IsString()
    @Matches(/^(?=.{5,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/, {
        message: 'Invalid username',
    })
    username: string;

    @IsString()
    @Matches(/^(?=.*[a-z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/, {
        message: 'Password must be at least 8 characters long, contain at least 1 letter and 1 number'
    })
    password: string;

    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    @MaxLength(20)
    displayName: string;

    @IsOptional()
    @IsString()
    @Matches(/^(?:https?:\/\/)?steamcommunity\.com\/(?:profiles|id)\/[a-zA-Z0-9\-._~]+\/?$/, {
        message: 'Not a valid steam profile link'
    })
    steamProfileLink: string;

    @IsOptional()
    @IsString()
    @Matches(/^(?:https?:\/\/)?steamcommunity\.com\/tradeoffer\/new\/[a-zA-Z0-9?=&-]+$/, {
        message: 'Not a valid steam trade link'
    })
    steamTradeLink: string;
}