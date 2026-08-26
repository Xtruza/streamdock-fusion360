const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const net = require('node:net');
const path = require('node:path');
const test = require('node:test');
const { spawn } = require('node:child_process');

function serverFrame(value) {
  const payload = Buffer.from(JSON.stringify(value));
  if (payload.length < 126) return Buffer.concat([Buffer.from([0x81, payload.length]), payload]);
  const header = Buffer.alloc(4); header[0] = 0x81; header[1] = 126; header.writeUInt16BE(payload.length, 2);
  return Buffer.concat([header, payload]);
}

function clientMessages(buffer) {
  const messages = [];
  while (buffer.length >= 6) {
    let length = buffer[1] & 0x7f, offset = 2;
    if (length === 126) { if (buffer.length < 8) break; length = buffer.readUInt16BE(2); offset = 4; }
    else if (length === 127) { if (buffer.length < 14) break; length = Number(buffer.readBigUInt64BE(2)); offset = 10; }
    if (buffer.length < offset + 4 + length) break;
    const mask = buffer.subarray(offset, offset + 4), payload = Buffer.from(buffer.subarray(offset + 4, offset + 4 + length));
    for (let index = 0; index < payload.length; index += 1) payload[index] ^= mask[index % 4];
    messages.push(JSON.parse(payload.toString()));
    buffer = buffer.subarray(offset + 4 + length);
  }
  return { messages, remainder: buffer };
}

test('plugin registers and responds to willAppear without hardware', async () => {
  const received = [];
  let socket;
  const server = net.createServer(connection => {
    socket = connection;
    let upgraded = false, sentWillAppear = false, buffer = Buffer.alloc(0);
    connection.on('data', chunk => {
      buffer = Buffer.concat([buffer, chunk]);
      if (!upgraded) {
        const end = buffer.indexOf('\r\n\r\n');
        if (end < 0) return;
        const request = buffer.subarray(0, end).toString();
        const key = /Sec-WebSocket-Key:\s*(.+)/i.exec(request)[1].trim();
        const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
        connection.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
        buffer = buffer.subarray(end + 4); upgraded = true;
      }
      const parsed = clientMessages(buffer); buffer = parsed.remainder; received.push(...parsed.messages);
      if (received.some(message => message.event === 'registerPlugin') && !sentWillAppear) {
        sentWillAppear = true;
        connection.write(serverFrame({
          event: 'willAppear', action: 'com.xtruza.streamdock.fusion360.command', context: 'key-1',
          payload: { settings: { preset: 'line', mode: 'shortcut', shortcut: 'L' }, coordinates: { column: 0, row: 0 }, controller: 'Keypad' }
        }));
      }
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const child = spawn(process.execPath, [path.resolve(__dirname, '../index.js'), '-port', String(port), '-pluginUUID', 'plugin-1', '-registerEvent', 'registerPlugin', '-info', JSON.stringify({ application: { language: 'en' } })], { stdio: 'ignore' });
  try {
    await new Promise((resolve, reject) => {
      let timer;
      const timeout = setTimeout(() => { clearInterval(timer); reject(new Error(`Timed out; received ${JSON.stringify(received)}`)); }, 2500);
      timer = setInterval(() => {
        if (received.some(message => message.event === 'setImage' && message.context === 'key-1')) {
          clearTimeout(timeout); clearInterval(timer); resolve();
        }
      }, 20);
    });
    assert.ok(received.some(message => message.event === 'registerPlugin'));
    assert.ok(received.some(message => message.event === 'getGlobalSettings'));
    const image = received.find(message => message.event === 'setImage');
    assert.match(image.payload.image, /^data:image\/svg\+xml/);
  } finally {
    socket?.destroy(); child.kill('SIGKILL'); server.closeAllConnections?.();
    await new Promise(resolve => server.close(resolve));
  }
});
