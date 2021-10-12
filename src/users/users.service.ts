import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserRegisterDTO } from './dtos/register.dto';
import { UserLoginDTO } from './dtos/login.dto';
import { PublicUser, User, UserWithToken } from './entities/user.entity';
import { UserUpdateDTO } from './dtos/update.dto';
import { UserChangePasswordDTO } from './dtos/changePassword.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private _userRepository: Repository<User>,
  ) { }

  public async register(user: UserRegisterDTO): Promise<UserWithToken> {
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

    createdUser.roles = [];

    return createdUser.tokenResponse();
  }

  public async login(user: UserLoginDTO): Promise<UserWithToken> {
    const username = user.username.toLowerCase();
    const password = user.password;

    const dbUser = await this._userRepository.findOne({ where: { username }, relations: ['roles'] });
    if (!dbUser || !(await dbUser.comparePassword(password))) {
      throw new HttpException(
        'Invalid username or password.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (dbUser.banned) {
      throw new HttpException(
        `This account has been banned! Reason: ${dbUser.banMessage}`,
        HttpStatus.FORBIDDEN,
      );
    }

    return dbUser.tokenResponse();
  }

  public async getCurrentUser(uuid: string): Promise<User> {
    const user = await this._userRepository.findOne(uuid, { relations: ['roles'] });
    if (!user) {
      throw new HttpException(
        'User not found.',
        HttpStatus.BAD_REQUEST,
      );
    }

    user.lastOnline = new Date();
    await this._userRepository.save(user);

    delete user.password;
    return user;
  }

  public async updateUser(data: UserUpdateDTO, uuid: string): Promise<UserWithToken> {
    const user = await this._userRepository.findOne(uuid, { relations: ['roles'] });
    if (!user) {
      throw new HttpException(
        'User not found.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!data.steamProfileLink && !data.steamTradeLink) {
      throw new HttpException(
        'Please provide either a steam profile link or trade link.',
        HttpStatus.BAD_REQUEST
      );
    }

    if (
      user.verified &&
      (user.steamProfileLink !== data.steamProfileLink ||
        user.steamTradeLink !== data.steamTradeLink)
    ) {
      user.verified = false;
    }

    user.email = data.email;
    user.displayName = data.displayName;
    user.steamProfileLink = data.steamProfileLink ? data.steamProfileLink : null;
    user.steamTradeLink = data.steamTradeLink ? data.steamTradeLink : null;
    user.discordTag = data.discordTag ? data.discordTag : null;
    user.usingSteamGuard = data.usingSteamGuard;
    user.hidden = data.hidden;

    const updatedUser = await this._userRepository.save(user);

    updatedUser.roles = user.roles;

    return updatedUser.tokenResponse();
  }

  public async changePassword(data: UserChangePasswordDTO, uuid: string) {
    const user = await this._userRepository.findOne(uuid, { relations: ['roles'] });
    if (!user) {
      throw new HttpException(
        'User not found.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!(await user.comparePassword(data.oldPassword))) {
      throw new HttpException(
        'Invalid old password.',
        HttpStatus.BAD_REQUEST,
      );
    }

    user.password = data.password;
    await user.hashPassword();

    const updatedUser = await this._userRepository.save(user);

    updatedUser.roles = user.roles;

    return updatedUser.tokenResponse();
  }

  public async getPublicUser(username: string): Promise<PublicUser> {
    const user = await this._userRepository.findOne({ where: { username, banned: false }, relations: ['roles'] });
    if (!user) {
      throw new HttpException(
        'User not found or has been banned.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return user.getPublicInfo();
  }
}
