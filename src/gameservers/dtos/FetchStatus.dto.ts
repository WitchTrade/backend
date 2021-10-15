export class FetchStatus {
    totalServers: number;
    fetchedServers: number;
    serversWithPlayers: number;
    resolvedPlayers: number;
    finisher: (value: unknown) => void;
}