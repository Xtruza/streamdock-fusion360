const crypto = require('node:crypto');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const { EventEmitter } = require('node:events');

const logDir = path.join(__dirname, '..', 'log');
function writeLog(level, values) {
    try {
        fs.mkdirSync(logDir, { recursive: true });
        const date = new Date();
        const value = item => item instanceof Error ? item.stack : typeof item === 'string' ? item : JSON.stringify(item);
        fs.appendFileSync(path.join(logDir, `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}.log`), `${date.toISOString()} ${level} ${values.map(value).join(' ')}\n`);
    } catch (_) { }
}
const log = { info: (...values) => writeLog('INFO', values), error: (...values) => writeLog('ERROR', values) };
process.on('uncaughtException', error => log.error('Uncaught Exception:', error));
process.on('unhandledRejection', reason => log.error('Unhandled Rejection:', reason));

function encodeClientFrame(data, opcode = 0x1) {
    const payload = Buffer.from(data), mask = crypto.randomBytes(4);
    let header;
    if (payload.length < 126) { header = Buffer.alloc(2); header[1] = 0x80 | payload.length; }
    else if (payload.length <= 0xffff) { header = Buffer.alloc(4); header[1] = 0x80 | 126; header.writeUInt16BE(payload.length, 2); }
    else { header = Buffer.alloc(10); header[1] = 0x80 | 127; header.writeBigUInt64BE(BigInt(payload.length), 2); }
    header[0] = 0x80 | opcode;
    const masked = Buffer.alloc(payload.length);
    for (let index = 0; index < payload.length; index += 1) masked[index] = payload[index] ^ mask[index % 4];
    return Buffer.concat([header, mask, masked]);
}

class LocalWebSocket extends EventEmitter {
    constructor(url) {
        super();
        const parsed = new URL(url);
        if (parsed.protocol !== 'ws:' || !['127.0.0.1', 'localhost'].includes(parsed.hostname)) throw new Error('Only local ws:// connections are allowed');
        this.buffer = Buffer.alloc(0); this.handshake = false; this.fragments = [];
        const key = crypto.randomBytes(16).toString('base64');
        const expected = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
        this.socket = net.createConnection({ host: parsed.hostname, port: Number(parsed.port) });
        this.socket.on('connect', () => this.socket.write(`GET ${parsed.pathname || '/'} HTTP/1.1\r\nHost: ${parsed.host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`));
        this.socket.on('data', chunk => {
            this.buffer = Buffer.concat([this.buffer, chunk]);
            if (!this.handshake) {
                const end = this.buffer.indexOf('\r\n\r\n');
                if (end < 0) return;
                const headers = this.buffer.subarray(0, end).toString('utf8');
                const accepted = /^Sec-WebSocket-Accept:\s*(.+)$/im.exec(headers)?.[1].trim();
                if (!/^HTTP\/1\.1 101/m.test(headers) || accepted !== expected) return this.socket.destroy(new Error('WebSocket handshake failed'));
                this.buffer = this.buffer.subarray(end + 4); this.handshake = true; this.emit('open');
            }
            this._parse();
        });
        this.socket.on('error', error => this.emit('error', error));
        this.socket.on('close', () => this.emit('close'));
    }
    send(data) { if (!this.handshake) throw new Error('WebSocket is not open'); this.socket.write(encodeClientFrame(data)); }
    _sendControl(opcode, payload = Buffer.alloc(0)) { this.socket.write(encodeClientFrame(payload, opcode)); }
    _parse() {
        while (this.buffer.length >= 2) {
            const first = this.buffer[0], second = this.buffer[1];
            const fin = Boolean(first & 0x80), opcode = first & 0x0f, masked = Boolean(second & 0x80);
            let length = second & 0x7f, offset = 2;
            if (length === 126) { if (this.buffer.length < 4) return; length = this.buffer.readUInt16BE(2); offset = 4; }
            else if (length === 127) { if (this.buffer.length < 10) return; const big = this.buffer.readBigUInt64BE(2); if (big > BigInt(8 * 1024 * 1024)) return this.socket.destroy(new Error('WebSocket frame too large')); length = Number(big); offset = 10; }
            const maskSize = masked ? 4 : 0;
            if (this.buffer.length < offset + maskSize + length) return;
            const mask = masked ? this.buffer.subarray(offset, offset + 4) : null;
            offset += maskSize;
            const payload = Buffer.from(this.buffer.subarray(offset, offset + length));
            this.buffer = this.buffer.subarray(offset + length);
            if (mask) for (let index = 0; index < payload.length; index += 1) payload[index] ^= mask[index % 4];
            if (opcode === 0x8) { this._sendControl(0x8); return this.socket.end(); }
            if (opcode === 0x9) { this._sendControl(0xA, payload); continue; }
            if (opcode === 0xA) continue;
            if (opcode === 0x1 || opcode === 0x0) this.fragments.push(payload);
            if (fin && (opcode === 0x1 || opcode === 0x0)) { this.emit('message', Buffer.concat(this.fragments)); this.fragments = []; }
        }
    }
}

class Plugins {
    static globalSettings = {};
    getGlobalSettingsFlag = true;
    constructor() {
        if (Plugins.instance) return Plugins.instance;
        this.ws = new LocalWebSocket(`ws://127.0.0.1:${process.argv[3]}`);
        this.ws.on('open', () => this.ws.send(JSON.stringify({ uuid: process.argv[5], event: process.argv[7] })));
        this.ws.on('error', error => log.error('WebSocket error', error));
        this.ws.on('close', () => process.exit());
        this.ws.on('message', message => {
            if (this.getGlobalSettingsFlag) { this.getGlobalSettingsFlag = false; this.getGlobalSettings(); }
            const data = JSON.parse(message.toString()), action = data.action?.split('.').pop();
            this[action]?.[data.event]?.(data);
            if (data.event === 'didReceiveGlobalSettings') Plugins.globalSettings = data.payload.settings;
            this[data.event]?.(data);
        });
        Plugins.instance = this;
    }
    _send(message) { this.ws.send(JSON.stringify(message)); }
    setGlobalSettings(payload) { Plugins.globalSettings = payload; this._send({ event: 'setGlobalSettings', context: process.argv[5], payload }); }
    getGlobalSettings() { this._send({ event: 'getGlobalSettings', context: process.argv[5] }); }
    setTitle(context, title) { this._send({ event: 'setTitle', context, payload: { target: 0, title: String(title) } }); }
    setImage(context, image) { this._send({ event: 'setImage', context, payload: { target: 0, image } }); }
    setState(context, state) { this._send({ event: 'setState', context, payload: { state } }); }
    setSettings(context, payload) { this._send({ event: 'setSettings', context, payload }); }
    showAlert(context) { this._send({ event: 'showAlert', context }); }
    showOk(context) { this._send({ event: 'showOk', context }); }
    sendToPropertyInspector(payload) { this._send({ action: Actions.currentAction, context: Actions.currentContext, payload, event: 'sendToPropertyInspector' }); }
    openUrl(url) { this._send({ event: 'openUrl', payload: { url } }); }
}

class Actions {
    static currentAction = null; static currentContext = null; static actions = {};
    constructor(data) { this.data = {}; this.default = {}; Object.assign(this, data); }
    propertyInspectorDidAppear(data) { Actions.currentAction = data.action; Actions.currentContext = data.context; this._propertyInspectorDidAppear?.(data); }
    willAppear(data) { Actions.actions[data.context] = data.action; const { context, payload: { settings } } = data; this.data[context] = Object.assign({ ...this.default }, settings); this._willAppear?.(data); }
    didReceiveSettings(data) { this.data[data.context] = Object.assign({ ...this.default }, data.payload.settings); this._didReceiveSettings?.(data); }
    willDisappear(data) { this._willDisappear?.(data); delete this.data[data.context]; }
}

module.exports = { log, Plugins, Actions, EventEmitter, LocalWebSocket, encodeClientFrame };
