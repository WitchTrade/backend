import { Injectable } from '@nestjs/common';
import 'dotenv/config';

import { SourceServerQuery } from './module/sourceServerQuery';
import { FetchStatus } from './dtos/FetchStatus.dto';
import { ServerCache } from './dtos/ServerCache.dto';
import { ServerInfo } from './dtos/ServerInfo.dto';
import servers from './static/servers';

@Injectable()
export class GameserversService {
  private _serverCache: ServerCache;

  private _sourceServerQuery: SourceServerQuery;

  constructor() {
    this._sourceServerQuery = new SourceServerQuery();
  }

  async getGameServers() {
    if (this._serverCache && this._cacheIsValid()) {
      return this._serverCache.cache;
    }
    return this._fetchServerInfos();
  }

  public async _fetchServerInfos() {
    let serverInfos: ServerInfo[] = [];
    let finisher: (value: unknown) => void;
    const finished = new Promise((resolve, reject) => {
      finisher = resolve;
    });
    const fetchStatus: FetchStatus = {
      totalServers: servers.length,
      fetchedServers: 0,
      serversWithPlayers: 0,
      resolvedPlayers: 0,
      finisher
    };
    for (const server of servers) {
      this._fetchServer(server.address, server.port, fetchStatus, serverInfos, server.name);
    }
    await finished;
    serverInfos = serverInfos.sort((a, b) => {
      if (a.playerCount > b.playerCount) {
        return -1;
      }
      if (a.playerCount < b.playerCount) {
        return 1;
      }
      return 0;
    });
    serverInfos = serverInfos.sort((a, b) => {
      if (a.name.substring(0, 2) > b.name.substring(0, 2)) {
        return 1;
      }
      if (a.name.substring(0, 2) < b.name.substring(0, 2)) {
        return -1;
      }
      return 0;
    });

    this._serverCache = { created: new Date(), cache: serverInfos };

    return serverInfos;
  }

  private async _fetchServer(ip: string, port: number, fetchStatus: FetchStatus, serverInfos: ServerInfo[], serverName: string) {
    const serverRes = await this._sourceServerQuery.info(ip, port, 2000);
    if (!serverRes) {
      fetchStatus.fetchedServers++;
      this._checkIfFinished(fetchStatus);
      return;
    }
    const infos: any = {};
    (serverRes.keywords as string).split(',').forEach(e => {
      const keyVal = e.split(':');
      infos[keyVal[0]] = keyVal[1];
    });
    if (parseInt(infos.PlayerCount_i, 10) > 0) {
      fetchStatus.serversWithPlayers++;
      serverInfos.push({ name: serverRes.name as string, playerCount: parseInt(infos.PlayerCount_i, 10), maxPlayers: serverRes.maxplayers as number, gameMode: infos.GameMode_s, players: null });
      this._fetchPlayers(ip, port, serverRes.name as string, fetchStatus, serverInfos);
    }
    fetchStatus.fetchedServers++;
    this._checkIfFinished(fetchStatus);
  }

  private async _fetchPlayers(ip: string, port: number, serverName: string, fetchStatus: FetchStatus, serverInfos: ServerInfo[]) {
    let playerRes = await this._sourceServerQuery.players(ip, port, 1000);
    if (!playerRes) {
      playerRes = await this._sourceServerQuery.players(ip, port, 2000);
    }
    if (!playerRes) {
      playerRes = await this._sourceServerQuery.players(ip, port, 2000);
      if (!playerRes) {
        fetchStatus.resolvedPlayers++;
        this._checkIfFinished(fetchStatus);
        return;
      }
    }
    const players = playerRes.filter(p => p.name).map(p => {
      return { name: Buffer.from(p.name, 'binary').toString(), playingFor: p.duration };
    }).sort((a, b) => b.playingFor - a.playingFor);
    const index = serverInfos.findIndex(s => s.name === serverName);
    serverInfos[index].players = players;
    fetchStatus.resolvedPlayers++;
    this._checkIfFinished(fetchStatus);
  }

  private _checkIfFinished(fetchStatus: FetchStatus) {
    if (fetchStatus.totalServers === fetchStatus.fetchedServers && fetchStatus.serversWithPlayers === fetchStatus.resolvedPlayers) {
      fetchStatus.finisher(null);
    }
  }

  private _cacheIsValid() {
    return (new Date().getTime() - this._serverCache.created.getTime()) < parseInt(process.env.GAMESERVERCACHETIME, 10);
  }
}
