import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { UserLoginDTO } from './dtos/login.dto';
import { UserRegisterDTO } from './dtos/register.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Post('register')
    public register(@Body() user: UserRegisterDTO) {
        return this.usersService.register(user);
    }

    @Post('login')
    public login(@Body() user: UserLoginDTO) {
        return this.usersService.login(user);
    }

}