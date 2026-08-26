const assert = require('node:assert/strict');
const test = require('node:test');
const { PRESETS, getPreset } = require('../src/catalog');
const { parseShortcut, toAppleScript, toSendKeys } = require('../src/shortcut');
const { isFusionApplication } = require('../src/platform');
const { renderCommandIcon } = require('../src/icon-renderer');
const { resolveCommand } = require('../src/executor');
const { encodeClientFrame } = require('../utils/plugin');

test('preset catalog has unique ids and safe fallbacks', () => {
  assert.equal(new Set(PRESETS.map(item => item.id)).size, PRESETS.length);
  assert.equal(getPreset('missing').id, 'extrude');
  for (const preset of PRESETS) assert.match(preset.commandId, /^[A-Za-z0-9_.:-]+$/);
});

test('shortcut parser supports macOS and Windows notation', () => {
  assert.deepEqual(parseShortcut('Cmd+Shift+E'), { key: 'E', modifiers: ['command', 'shift'] });
  assert.match(toAppleScript('Cmd+Shift+E'), /command down, shift down/);
  assert.equal(toSendKeys('Ctrl+Alt+E'), '^%e');
  assert.throws(() => parseShortcut('Hyper+E'), /Unknown modifier/);
});

test('frontmost application check recognizes Fusion only', () => {
  assert.equal(isFusionApplication('Autodesk Fusion'), true);
  assert.equal(isFusionApplication('Fusion 360'), true);
  assert.equal(isFusionApplication('Finder'), false);
});

test('settings override a preset and icons are encoded', () => {
  assert.deepEqual(resolveCommand({ preset: 'line', commandId: 'CustomCmd', shortcut: 'X' }), {
    commandId: 'CustomCmd', shortcut: 'X', requireFusionFrontmost: true
  });
  assert.match(renderCommandIcon(getPreset('line')), /^data:image\/svg\+xml;charset=utf8,/);
  assert.doesNotMatch(renderCommandIcon(getPreset('line')), /<svg/);
});

test('local WebSocket client creates masked RFC 6455 text frames', () => {
  const frame = encodeClientFrame('hello');
  assert.equal(frame[0], 0x81);
  assert.equal(Boolean(frame[1] & 0x80), true);
  assert.equal(frame[1] & 0x7f, 5);
  const mask = frame.subarray(2, 6), encoded = frame.subarray(6);
  const decoded = Buffer.from(encoded.map((byte, index) => byte ^ mask[index % 4])).toString();
  assert.equal(decoded, 'hello');
});
