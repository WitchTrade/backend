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
import { SyncSettingsUpdateDTO } from './dtos/updateSyncSettings.dto';
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

    const dynamicRarityPrice = await this._priceRepository.findOne({ where: { priceKey: 'dynamicRarity' } });

    if (!dynamicRarityPrice) {
      console.error('Dynamic rarity price not found while registering a new account.');
      throw new HttpException(
        'There was an error while creating your account.',
        HttpStatus.BAD_REQUEST
      );
    }

    const syncSettings = await this._syncSettingsRepository.save({
      mainPriceItem: dynamicRarityPrice,
      mainPriceRecipe: dynamicRarityPrice
    });
    createdUser.syncSettings = syncSettings;

    const market = await this._marketRepository.save({ lastUpdated: new Date() });
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

    const dbUser = await this._userRepository.findOne({ where: { username }, relations: ['roles', 'badges'] });
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
    let decodedToken: { id: string, username: string, type: string, iat: number, exp: number; };
    try {
      decodedToken = jwt.decode(tokens.token) as { id: string, username: string, type: string, iat: number, exp: number; };
    } catch {
      throw new HttpException(
        'Invalid token provided',
        HttpStatus.FORBIDDEN,
      );
    }

    const user = await this._userRepository.findOne(decodedToken.id);
    if (!user) {
      throw new HttpException(
        `User not found`,
        HttpStatus.FORBIDDEN,
      );
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
    return { token: newTokenUser.token, refreshToken: newTokenUser.refreshToken };
  }

  public async getCurrentUser(uuid: string): Promise<User> {
    const user = await this._userRepository.findOne(uuid, { relations: ['roles', 'badges'] });
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

  public async getSyncSettings(uuid: string): Promise<SyncSettings> {
    const user = await this._userRepository.findOne(uuid, { relations: ['syncSettings'] });
    if (!user) {
      throw new HttpException(
        'User not found.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return user.syncSettings;
  }

  public async updateSyncSettings(data: SyncSettingsUpdateDTO, uuid: string): Promise<SyncSettings> {
    const user = await this._userRepository.findOne(uuid, { relations: ['syncSettings'] });
    if (!user) {
      throw new HttpException(
        'User not found.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const prices = await this._priceRepository.find();

    if (
      !prices.some(p => p.id === data.mainPriceItem.id) ||
      (data.secondaryPriceItem && !prices.some(p => p.id === data.secondaryPriceItem.id)) ||
      !prices.some(p => p.id === data.mainPriceRecipe.id) ||
      (data.secondaryPriceRecipe && !prices.some(p => p.id === data.secondaryPriceRecipe.id))
    ) {
      throw new HttpException(
        'Some prices were not found in the database',
        HttpStatus.NOT_FOUND,
      );
    }

    if (
      !prices.find(p => p.id === data.mainPriceItem.id).canBeMain ||
      !prices.find(p => p.id === data.mainPriceRecipe.id).canBeMain
    ) {
      throw new HttpException(
        'Some prices which cannot be the main price are configured as the main price.',
        HttpStatus.NOT_FOUND,
      );
    }

    const syncSettings = user.syncSettings;

    syncSettings.syncInventory = data.syncInventory;
    syncSettings.syncMarket = data.syncMarket;
    syncSettings.mode = data.mode;
    syncSettings.rarity = data.rarity;

    syncSettings.mainPriceItem = prices.find(p => p.id === data.mainPriceItem.id);
    if (syncSettings.mainPriceItem.withAmount) {
      if (!data.mainPriceAmountItem) {
        throw new HttpException(
          'Main item price requires amount.',
          HttpStatus.NOT_FOUND,
        );
      }
      syncSettings.mainPriceAmountItem = data.mainPriceAmountItem;
    } else {
      syncSettings.mainPriceAmountItem = null;
    }


    if (data.secondaryPriceItem) {
      syncSettings.secondaryPriceItem = prices.find(p => p.id === data.secondaryPriceItem.id);
      if (syncSettings.secondaryPriceItem.withAmount) {
        if (!data.secondaryPriceAmountItem) {
          throw new HttpException(
            'Secondary item price requires amount.',
            HttpStatus.NOT_FOUND,
          );
        }
        syncSettings.secondaryPriceAmountItem = data.secondaryPriceAmountItem;
      } else {
        syncSettings.secondaryPriceAmountItem = null;
      }
    }

    syncSettings.mainPriceRecipe = prices.find(p => p.id === data.mainPriceRecipe.id);
    if (syncSettings.mainPriceRecipe.withAmount) {
      if (!data.mainPriceAmountRecipe) {
        throw new HttpException(
          'Main recipe price requires amount.',
          HttpStatus.NOT_FOUND,
        );
      }
      syncSettings.mainPriceAmountRecipe = data.mainPriceAmountRecipe;
    } else {
      syncSettings.mainPriceAmountRecipe = null;
    }

    if (data.secondaryPriceRecipe) {
      syncSettings.secondaryPriceRecipe = prices.find(p => p.id === data.secondaryPriceRecipe.id);
      if (syncSettings.secondaryPriceRecipe.withAmount) {
        if (!data.secondaryPriceAmountRecipe) {
          throw new HttpException(
            'Secondary recipe price requires amount.',
            HttpStatus.NOT_FOUND,
          );
        }
        syncSettings.secondaryPriceAmountRecipe = data.secondaryPriceAmountRecipe;
      } else {
        syncSettings.secondaryPriceAmountRecipe = null;
      }
    }

    syncSettings.keepItem = data.keepItem;
    syncSettings.keepRecipe = data.keepRecipe;
    syncSettings.ignoreWishlistItems = data.ignoreWishlistItems;
    syncSettings.removeNoneOnStock = data.removeNoneOnStock;

    const updatedSyncSettings = await this._syncSettingsRepository.save(syncSettings);

    return updatedSyncSettings;
  }

  public async updateUser(data: UserUpdateDTO, uuid: string): Promise<UserWithToken> {
    const user = await this._userRepository.findOne(uuid, { relations: ['roles', 'badges'] });
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

    if (!data.steamProfileLink) {
      data.steamProfileLink = null;
    }
    if (!data.steamTradeLink) {
      data.steamTradeLink = null;
    }
    if (
      user.verified &&
      (user.steamProfileLink !== data.steamProfileLink ||
        user.steamTradeLink !== data.steamTradeLink)
    ) {
      user.verified = false;
    }
    if (
      user.verifiedSteamProfileLink &&
      user.steamProfileLink !== data.steamProfileLink
    ) {
      user.verifiedSteamProfileLink = false;
    }

    user.email = data.email;
    user.displayName = data.displayName;
    user.steamProfileLink = data.steamProfileLink ? data.steamProfileLink : null;
    user.steamTradeLink = data.steamTradeLink ? data.steamTradeLink : null;
    user.discordTag = data.discordTag ? data.discordTag : null;
    user.usingSteamGuard = data.usingSteamGuard;
    user.hidden = data.hidden;

    const existingUser = await this._userRepository.findOne({
      where: [
        { username: Not(user.username), email: user.email },
        { username: Not(user.username), displayName: user.displayName }
      ]
    });
    if (existingUser) {
      const duplicate = existingUser.email === user.email ? 'email' : 'displayName';
      throw new HttpException(
        `User with this ${duplicate} already exists`,
        HttpStatus.BAD_REQUEST
      );
    }

    const updatedUser = await this._userRepository.save(user);

    updatedUser.roles = user.roles;
    updatedUser.badges = user.badges;

    return updatedUser.tokenResponse();
  }

  public async changePassword(data: UserChangePasswordDTO, uuid: string) {
    const user = await this._userRepository.findOne(uuid, { relations: ['roles', 'badges'] });
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
    updatedUser.badges = user.badges;

    return updatedUser.tokenResponse();
  }

  public async getPublicUser(username: string): Promise<PublicUser> {
    const user = await this._userRepository.findOne({ where: { username, banned: false }, relations: ['roles', 'badges'] });
    if (!user) {
      throw new HttpException(
        'User not found or has been banned.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return user.getPublicInfo();
  }
}
