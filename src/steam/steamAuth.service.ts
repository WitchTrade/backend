import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request } from 'express';
import 'dotenv/config';

import { SteamAuth } from './steamAuth';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { WitchItService } from 'src/witchit/witchIt.service';

@Injectable()
export class SteamAuthService {
  private _steamAuth: SteamAuth;

  constructor(
    @InjectRepository(User)
    private _userRepository: Repository<User>,
    private _witchItService: WitchItService,
  ) {
    this._steamAuth = new SteamAuth();
  }

  public async login(uuid: string) {
    const user = await this._userRepository.findOne(uuid);

    if (!user) {
      throw new HttpException('User not found.', HttpStatus.BAD_REQUEST);
    }

    if (user.steamProfileLink) {
      throw new HttpException(
        'User already has a steam profile linked.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const redirectUrl = await this._steamAuth.getRedirectUrl();

    if (!redirectUrl) {
      throw new HttpException(
        'Steam authentication failed',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return redirectUrl;
  }

  public async auth(req: Request, uuid: string) {
    const steamId = await this._steamAuth.authenticate(req.url);

    if (!steamId) {
      throw new HttpException(
        'Steam authentication failed',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this._userRepository.findOne(uuid, {
      relations: ['roles', 'badges'],
    });

    if (!user) {
      throw new HttpException('User not found.', HttpStatus.BAD_REQUEST);
    }

    user.steamProfileLink = `https://steamcommunity.com/profiles/${steamId}`;

    const witchItResponse = (
      await this._witchItService.getWitchItUserId(
        'steam',
        user.steamProfileLink,
      )
    ).data;
    if (witchItResponse.success) {
      user.witchItUserId = witchItResponse.witchItId;
    }

    const updatedUser = await this._userRepository.save(user);

    updatedUser.roles = user.roles;
    updatedUser.badges = user.badges;

    return updatedUser.tokenResponse();
  }
}
