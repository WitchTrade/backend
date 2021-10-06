import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { UserDecorator } from './decorators/user.decorator';

import { UserLoginDTO } from './dtos/login.dto';
import { UserRegisterDTO } from './dtos/register.dto';
import { User, UserWithToken } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Post('register')
    public register(@Body() user: UserRegisterDTO): Promise<UserWithToken> {
        return this.usersService.register(user);
    }

    @HttpCode(200)
    @Post('login')
    public login(@Body() user: UserLoginDTO): Promise<UserWithToken> {
        return this.usersService.login(user);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @Get('current')
    public getCurrentUser(@UserDecorator('id') uuid: string): Promise<User> {
        return this.usersService.getCurrentUser(uuid);
    }
}
