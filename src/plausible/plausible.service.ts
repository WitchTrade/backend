import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import * as rawbody from 'raw-body';

@Injectable()
export class PlausibleService {
  constructor(private readonly httpService: HttpService) {}

  public async getScript(response: Response) {
    const script = await this.httpService.axiosRef.get(
      `${process.env.PLAUSIBLE_HOST}/js/script.js`,
    );
    response.setHeader('Content-Type', 'text/javascript');
    response.send(script.data);
  }

  public async postEvent(request: Request) {
    const forwardedHeaders = {
      'User-Agent': request.headers['user-agent'] as string,
      'Content-Type': 'application/json',
      'X-Forwarded-Proto': request.headers['cf-visitor']
        ? JSON.parse(request.headers['cf-visitor'] as string).scheme
        : request.protocol,
      'cf-connecting-ip': request.headers['cf-connecting-ip']
        ? (request.headers['cf-connecting-ip'] as string)
        : request.ip,
      'X-Forwarded-Host': request.hostname,
    };

    let body = request.body;

    if (request.readable) {
      const raw = await rawbody(request);
      body = raw.toString().trim();
    }

    await this.httpService.axiosRef.post(
      `${process.env.PLAUSIBLE_HOST}/api/event`,
      body,
      {
        headers: forwardedHeaders,
      },
    );
  }
}
