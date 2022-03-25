import { Injectable } from '@nestjs/common';
import 'dotenv/config';
import {
  InfoResponse,
  PlayerResponse,
  queryGameServerInfo,
  queryGameServerPlayer,
  queryMasterServer,
  REGIONS,
} from 'steam-server-query';
import { FetchStatus } from './dtos/FetchStatus.dto';

import { ServerCache } from './dtos/ServerCache.dto';
import { ServerInfo } from './dtos/ServerInfo.dto';

@Injectable()
export class GameserversService {
  private _serverCache: ServerCache;

  async getGameServers() {
    if (this._serverCache && this._cacheIsValid()) {
      return this._serverCache.cache;
    }
    const serverWithPlayers = await queryMasterServer(
      process.env.STEAMMASTERSERVER,
      REGIONS.ALL,
      { appid: parseInt(process.env.WITCHITAPPID), empty: 1 },
      1000,
    );
    return this._fetchServerInfos(serverWithPlayers);
  }

  public async _fetchServerInfos(serverHosts: string[]) {
    let serverInfos: ServerInfo[] = [];
    let finisher: (value: unknown) => void;
    const finished = new Promise((resolve) => {
      finisher = resolve;
    });
    const fetchStatus: FetchStatus = {
      totalServers: serverHosts.length,
      fetchedServers: 0,
      serversWithPlayers: 0,
      resolvedPlayers: 0,
      finisher,
    };
    for (const server of serverHosts) {
      this._fetchServer(server, fetchStatus, serverInfos);
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

  private async _fetchServer(
    server: string,
    fetchStatus: FetchStatus,
    serverInfos: ServerInfo[],
  ) {
    let serverRes: InfoResponse;
    try {
      serverRes = await queryGameServerInfo(server, 2, 2000);
    } catch (err) {
      console.error(`Error for ${server}`);
      fetchStatus.fetchedServers++;
      this._checkIfFinished(fetchStatus);
      return;
    }
    const infos: any = {};
    (serverRes.keywords as string).split(',').forEach((e) => {
      const keyVal = e.split(':');
      infos[keyVal[0]] = keyVal[1];
    });
    if (parseInt(infos.PlayerCount_i) > 0) {
      fetchStatus.serversWithPlayers++;
      serverInfos.push({
        name: serverRes.name,
        playerCount: parseInt(infos.PlayerCount_i),
        maxPlayers: serverRes.maxPlayers,
        gameMode: infos.GameMode_s,
        players: null,
      });
      this._fetchPlayers(server, serverRes.name, fetchStatus, serverInfos);
    }
    fetchStatus.fetchedServers++;
    this._checkIfFinished(fetchStatus);
  }

  private async _fetchPlayers(
    server: string,
    serverName: string,
    fetchStatus: FetchStatus,
    serverInfos: ServerInfo[],
  ) {
    let playerRes: PlayerResponse;
    try {
      playerRes = await queryGameServerPlayer(server, 3, [2000, 2000, 4000]);
    } catch (err) {
      console.error(`Error getting players for ${server}, ${serverName}`);
      fetchStatus.resolvedPlayers++;
      this._checkIfFinished(fetchStatus);
      return;
    }
    const players = playerRes.players
      .filter((p) => p.name)
      .map((p) => {
        return { name: p.name, playingFor: p.duration };
      });
    const index = serverInfos.findIndex((s) => s.name === serverName);
    serverInfos[index].players = players;
    fetchStatus.resolvedPlayers++;
    this._checkIfFinished(fetchStatus);
  }

  private _checkIfFinished(fetchStatus: FetchStatus) {
    if (
      fetchStatus.totalServers === fetchStatus.fetchedServers &&
      fetchStatus.serversWithPlayers === fetchStatus.resolvedPlayers
    ) {
      fetchStatus.finisher(null);
    }
  }

  private _cacheIsValid() {
    return (
      new Date().getTime() - this._serverCache.created.getTime() <
      parseInt(process.env.GAMESERVERCACHETIME, 10)
    );
  }
}
