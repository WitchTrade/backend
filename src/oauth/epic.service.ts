import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request } from 'express';
import 'dotenv/config';

import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { WitchItService } from 'src/witchit/witchIt.service';
import { EpicOAuth } from 'src/oauth/EpicOAuth';

@Injectable()
export class EpicService {
  private _epicAuth: EpicOAuth;

  constructor(
    @InjectRepository(User)
    private _userRepository: Repository<User>,
    private _witchItService: WitchItService,
  ) {
    this._epicAuth = new EpicOAuth();
  }

  public async login(uuid: string) {
    const user = await this._userRepository.findOne(uuid);

    if (!user) {
      throw new HttpException('User not found.', HttpStatus.BAD_REQUEST);
    }

    if (user.epicAccountId) {
      throw new HttpException(
        'User already has a epic games profile linked.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const redirectUrl = await this._epicAuth.getRedirectUrl();

    if (!redirectUrl) {
      throw new HttpException(
        'Epic Games authentication failed',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return redirectUrl;
  }

  public async auth(req: Request, uuid: string) {
    const epicAccountId = await this._epicAuth.authenticate(
      req.protocol + '://' + req.get('host') + req.originalUrl,
    );

    if (!epicAccountId) {
      throw new HttpException(
        'Epic Games authentication failed',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this._userRepository.findOne(uuid, {
      relations: ['roles', 'badges'],
    });

    if (!user) {
      throw new HttpException('User not found.', HttpStatus.BAD_REQUEST);
    }

    user.epicAccountId = epicAccountId;
    user.steamProfileLink = null;
    user.verified = false;

    const witchItResponse = (
      await this._witchItService.getWitchItUserId('epic', user.epicAccountId)
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
