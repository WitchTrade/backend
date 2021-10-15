import { createSocket, Socket } from 'dgram';
import bufferpack from './bufferpack';

export class SourceServerQuery {
    private _client: Socket;

    constructor() {
        this._client = createSocket('udp4');
        this._client.setMaxListeners(160);
    }

    private _send(buffer, address, port, code, timeout = 1000) {
        return new Promise((resolve, reject) => {
            this._client.send(buffer, 0, buffer.length, port, address, (err, bytes) => {
                if (err) return reject(typeof err == 'string' ? new Error(err) : err);

                let response = (buffer, remote) => {
                    //Any unmatched parameter will return rather than error so that multiple requests can be made at once.
                    if (remote.address != address) return;
                    if (remote.port != port) return;
                    if (buffer.length < 1) return;
                    buffer = buffer.slice('4');
                    if (bufferpack.unpack('<s', buffer)[0] !== code) return;
                    this._client.removeListener('message', response);
                    clearTimeout(time);
                    return resolve(buffer.slice(1));
                };

                let time = setTimeout(() => {
                    this._client.removeListener('message', response);
                    return reject(null);
                }, timeout);

                this._client.on('message', response);
            });
        });
    };

    private async _challenge(address, port, code, timeout = 1000) {

        let buffer = this._send(bufferpack.pack('<isi', [-1, code, -1]), address, port, 'A', timeout);
        let resolvedBuffer;
        try {
            resolvedBuffer = await buffer;
        } catch (err) {
            return typeof err == 'string' ? new Error(err) : err;
        }
        return bufferpack.unpack('<i', resolvedBuffer)[0];
    };

    public async info(address, port, timeout = 1000) {
        let buffer = this._send(bufferpack.pack('<isS', [-1, 'T', 'Source Engine Query']), address, port, 'I', timeout);
        let resolvedBuffer;
        try {
            resolvedBuffer = await buffer;
        } catch (err) {
            return typeof err == 'string' ? new Error(err) : err;
        }

        let list = bufferpack.unpack('<bSSSShBBBssBB', resolvedBuffer);
        let keys = ['protocol', 'name', 'map', 'folder', 'game', 'appid', 'playersnum', 'maxplayers', 'botsnum', 'servertype', 'environment', 'visibility', 'vac'];
        let info: any = {};
        for (let i = 0; i < list.length; i++) {
            info[keys[i]] = list[i];
        }

        resolvedBuffer = resolvedBuffer.slice(bufferpack.calcLength('<bSSSShBBBssBB', list));
        info.version = bufferpack.unpack('<S', resolvedBuffer)[0];
        resolvedBuffer = resolvedBuffer.slice(bufferpack.calcLength('<S', [info.version]));

        if (resolvedBuffer.length > 1) {
            let offset = 0;
            let EDF = bufferpack.unpack('<b', resolvedBuffer)[0];
            offset += 1;
            if ((EDF & 0x80) !== 0) {
                info.port = bufferpack.unpack('<h', resolvedBuffer, offset)[0];
                offset += 2;
            }
            if ((EDF & 0x10) !== 0) {
                info.steamID = bufferpack.unpack('<ii', resolvedBuffer, offset)[0];
                offset += 8;
            }
            if ((EDF & 0x40) !== 0) {
                let tvinfo = bufferpack.unpack('<hS', resolvedBuffer, offset);
                info['tv-port'] = tvinfo[0];
                info['tv-name'] = tvinfo[1];
                offset += bufferpack.calcLength('<hS', tvinfo);
            }
            if ((EDF & 0x20) !== 0) {
                info.keywords = bufferpack.unpack('<S', resolvedBuffer, offset)[0];
                offset += bufferpack.calcLength('<S', info.keywords);
            }
            if ((EDF & 0x01) !== 0) {
                info.gameID = bufferpack.unpack('<i', resolvedBuffer, offset)[0];
                offset += 4;
            }
        }

        return info;
    };

    public async players(address, port, timeout = 1000) {
        let key = this._challenge(address, port, 'U', timeout);
        try {
            key = await key;
        } catch (err) {
            return typeof err == 'string' ? new Error(err) : err;
        }

        let buffer = this._send(bufferpack.pack('<isi', [-1, 'U', key]), address, port, 'D', timeout);
        let resolvedBuffer;
        try {
            resolvedBuffer = await buffer;
        } catch (err) {
            return typeof err == 'string' ? new Error(err) : err;
        }

        let count = bufferpack.unpack('<B', resolvedBuffer)[0];
        let offset = 1;
        let players = [];
        let keys = ['index', 'name', 'score', 'duration'];
        for (let i = 0; i < count; i++) {
            let list = bufferpack.unpack('<bSif', resolvedBuffer, offset);
            let player = {};
            for (let i = 0; i < list.length; i++) {
                player[keys[i]] = list[i];
            }
            offset += bufferpack.calcLength('<bSif', list);
            players.push(player);
        }

        return players;
    };

    public async rules(address, port, timeout = 1000) {
        let key = this._challenge(address, port, 'V', timeout);
        try {
            key = await key;
        } catch (err) {
            return typeof err == 'string' ? new Error(err) : err;
        }

        let buffer = this._send(bufferpack.pack('<isi', [-1, 'V', key]), address, port, 'E', timeout);
        let resolvedBuffer;
        try {
            resolvedBuffer = await buffer;
        } catch (err) {
            return typeof err == 'string' ? new Error(err) : err;
        }

        let count = bufferpack.unpack('<h', resolvedBuffer)[0];
        let rules = [];
        let keys = ['name', 'value'];
        let offset = 2;
        for (let i = 0; i < count; i++) {
            let list = bufferpack.unpack('<SS', resolvedBuffer, offset);
            let rule = {};
            for (let i = 0; i < list.length; i++) {
                rule[keys[i]] = list[i];
            }
            rules.push(rule);
            offset += bufferpack.calcLength('<SS', list);
        }

        return rules;
    };

    public destroy() {
        this._client.close();
    }
}