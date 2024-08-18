import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';

import { UserRegisterDTO } from './dtos/register.dto';
import { UserLoginDTO } from './dtos/login.dto';
import { PublicUser, User, UserWithToken } from './entities/user.entity';
import { UserUpdateDTO } from './dtos/update.dto';
import { UserChangePasswordDTO } from './dtos/changePassword.dto';
import { SyncSettings } from './entities/syncSettings.entity';
import { Market } from '../markets/entities/market.entity';
import { UserRefreshDTO } from './dtos/refresh.dto';
import { Price } from 'src/markets/entities/price.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private _userRepository: Repository<User>,
    @InjectRepository(SyncSettings)
    private _syncSettingsRepository: Repository<SyncSettings>,
    @InjectRepository(Market)
    private _marketRepository: Repository<Market>,
    @InjectRepository(Price)
    private _priceRepository: Repository<Price>,
  ) {}

  public async register(user: UserRegisterDTO): Promise<UserWithToken> {
    user.username = user.username.toLowerCase();
    user.email = user.email.toLowerCase();

    const existingUser = await this._userRepository.findOne({
      where: [
        { username: user.username },
        { email: user.email },
        { displayName: user.displayName },
      ],
    });
    if (existingUser) {
      const duplicate =
        existingUser.username === user.username
          ? 'username'
          : existingUser.email === user.email
          ? 'email'
          : 'displayName';
      throw new HttpException(
        `User with this ${duplicate} already exists`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const createdUser = this._userRepository.create(user);

    const dynamicRarityPrice = await this._priceRepository.findOne({
      where: { priceKey: 'dynamicRarity' },
    });

    if (!dynamicRarityPrice) {
      console.error(
        'Dynamic rarity price not found while registering a new account.',
      );
      throw new HttpException(
        'There was an error while creating your account.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const syncSettings = await this._syncSettingsRepository.save({
      mainPriceItem: dynamicRarityPrice,
      mainPriceRecipe: dynamicRarityPrice,
    });
    createdUser.syncSettings = syncSettings;

    const market = await this._marketRepository.save({
      lastUpdated: new Date(),
    });
    createdUser.market = market;

    await this._userRepository.save(createdUser);

    createdUser.roles = [];
    createdUser.badges = [];

    delete createdUser.syncSettings;
    delete createdUser.market;

    return createdUser.tokenResponse();
  }

  public async login(user: UserLoginDTO): Promise<UserWithToken> {
    const username = user.username.toLowerCase();
    const password = user.password;

    const dbUser = await this._userRepository.findOne({
      where: { username },
      relations: ['roles', 'badges'],
    });
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

  public async refresh(tokens: UserRefreshDTO): Promise<UserRefreshDTO> {
    let decodedToken: {
      id: string;
      username: string;
      type: string;
      iat: number;
      exp: number;
    };
    try {
      decodedToken = jwt.decode(tokens.token) as {
        id: string;
        username: string;
        type: string;
        iat: number;
        exp: number;
      };
    } catch {
      throw new HttpException('Invalid token provided', HttpStatus.FORBIDDEN);
    }

    const user = await this._userRepository.findOne(decodedToken.id);
    if (!user) {
      throw new HttpException(`User not found`, HttpStatus.FORBIDDEN);
    }
    if (user.banned) {
      throw new HttpException(
        `This account has been banned! Reason: ${user.banMessage}`,
        HttpStatus.FORBIDDEN,
      );
    }

    const refreshSecret = process.env.REFRESHSECRET + user.password;
    try {
      jwt.verify(tokens.refreshToken, refreshSecret);
    } catch {
      throw new HttpException(
        'Refresh token is invalid! Please log in again.',
        HttpStatus.FORBIDDEN,
      );
    }

    const newTokenUser = user.tokenResponse();
    return {
      token: newTokenUser.token,
      refreshToken: newTokenUser.refreshToken,
    };
  }

  public async getCurrentUser(uuid: string): Promise<User> {
    const user = await this._userRepository.findOne(uuid, {
      relations: ['roles', 'badges'],
    });
    if (!user) {
      throw new HttpException('User not found.', HttpStatus.BAD_REQUEST);
    }

    user.lastOnline = new Date();
    await this._userRepository.save(user);

    delete user.password;
    return user;
  }

  public async getSyncSettings(uuid: string): Promise<SyncSettings> {
    const user = await this._userRepository.findOne(uuid, {
      relations: [
        'syncSettings',
        'syncSettings.mainPriceItem',
        'syncSettings.secondaryPriceItem',
        'syncSettings.mainPriceRecipe',
        'syncSettings.secondaryPriceRecipe',
        'syncSettings.ignoreList',
      ],
    });
    if (!user) {
      throw new HttpException('User not found.', HttpStatus.BAD_REQUEST);
    }

    return user.syncSettings;
  }

  public async updateUser(
    data: UserUpdateDTO,
    uuid: string,
  ): Promise<UserWithToken> {
    const user = await this._userRepository.findOne(uuid, {
      relations: ['roles', 'badges'],
    });
    if (!user) {
      throw new HttpException('User not found.', HttpStatus.BAD_REQUEST);
    }
    user.email = data.email;
    user.displayName = data.displayName;
    user.discordTag = data.discordTag ? data.discordTag : null;
    user.hidden = data.hidden;

    const existingUser = await this._userRepository.findOne({
      where: [
        { username: Not(user.username), email: user.email },
        { username: Not(user.username), displayName: user.displayName },
      ],
    });
    if (existingUser) {
      const duplicate =
        existingUser.email === user.email ? 'email' : 'displayName';
      throw new HttpException(
        `User with this ${duplicate} already exists`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const updatedUser = await this._userRepository.save(user);

    updatedUser.roles = user.roles;
    updatedUser.badges = user.badges;

    return updatedUser.tokenResponse();
  }

  public async unlinkSteam(uuid: string): Promise<UserWithToken> {
    const user = await this._userRepository.findOne(uuid, {
      relations: ['roles', 'badges'],
    });
    if (!user) {
      throw new HttpException('User not found.', HttpStatus.BAD_REQUEST);
    }

    user.steamProfileLink = null;
    user.witchItUserId = null;

    const updatedUser = await this._userRepository.save(user);

    updatedUser.roles = user.roles;
    updatedUser.badges = user.badges;

    return updatedUser.tokenResponse();
  }

  public async unlinkEpic(uuid: string): Promise<UserWithToken> {
    const user = await this._userRepository.findOne(uuid, {
      relations: ['roles', 'badges'],
    });
    if (!user) {
      throw new HttpException('User not found.', HttpStatus.BAD_REQUEST);
    }

    user.epicAccountId = null;
    user.witchItUserId = null;

    const updatedUser = await this._userRepository.save(user);

    updatedUser.roles = user.roles;
    updatedUser.badges = user.badges;

    return updatedUser.tokenResponse();
  }

  public async changePassword(data: UserChangePasswordDTO, uuid: string) {
    const user = await this._userRepository.findOne(uuid, {
      relations: ['roles', 'badges'],
    });
    if (!user) {
      throw new HttpException('User not found.', HttpStatus.BAD_REQUEST);
    }

    if (!(await user.comparePassword(data.oldPassword))) {
      throw new HttpException('Invalid old password.', HttpStatus.BAD_REQUEST);
    }

    user.password = data.password;
    await user.hashPassword();

    const updatedUser = await this._userRepository.save(user);

    updatedUser.roles = user.roles;
    updatedUser.badges = user.badges;

    return updatedUser.tokenResponse();
  }

  public async getPublicUser(username: string): Promise<PublicUser> {
    const user = await this._userRepository.findOne({
      where: { username, banned: false },
      relations: ['roles', 'badges'],
    });
    if (!user) {
      throw new HttpException(
        'User not found or has been banned.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return user.getPublicInfo();
  }
}
