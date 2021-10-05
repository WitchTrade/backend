import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserRegisterDTO } from './dtos/register.dto';
import { UserLoginDTO } from './dtos/login.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {

    constructor(
        @InjectRepository(User)
        private _userRepository: Repository<User>,
    ) { }

    public async register(user: UserRegisterDTO) {
        if (!user.steamProfileLink && !user.steamTradeLink) {
            throw new HttpException(
                'Please provide either a steam profile link or trade link.',
                HttpStatus.BAD_REQUEST
            );
        }

        user.username = user.username.toLowerCase();
        user.email = user.email.toLowerCase();

        const existingUser = await this._userRepository.findOne({
            where: [
                { username: user.username },
                { email: user.email },
                { displayName: user.displayName }
            ]
        });
        if (existingUser) {
            const duplicate = existingUser.username === user.username ? 'username' : existingUser.email === user.email ? 'email' : 'displayName';
            throw new HttpException(
                `User with this ${duplicate} already exists`,
                HttpStatus.BAD_REQUEST
            );
        }

        const createdUser = this._userRepository.create(user);
        await this._userRepository.save(createdUser);

        return createdUser.tokenResponse();
    }

    public async login(user: UserLoginDTO) {
        const username = user.username.toLowerCase();
        const password = user.password;

        const dbUser = await this._userRepository.findOne({ where: { username } });
        if (!dbUser || !(await dbUser.comparePassword(password))) {
            throw new HttpException(
                'Invalid username or password.',
                HttpStatus.BAD_REQUEST,
            );
        }

        return dbUser.tokenResponse();
    }
}
