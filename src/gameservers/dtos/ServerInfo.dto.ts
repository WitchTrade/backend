export class ServerPlayer {
  name: string;
  playingFor: number;
}

export class ServerInfo {
  name: string;
  gameMode: string;
  playerCount: number;
  maxPlayers: number;
  players: ServerPlayer[];
}
