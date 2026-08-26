import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const bundle = path.join(root, 'com.xtruza.streamdock.fusion360.sdPlugin');

test('manifest is valid and path-independent', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(bundle, 'manifest.json'), 'utf8'));
  assert.equal(manifest.SDKVersion, 1);
  assert.equal(manifest.Nodejs.Version, '20');
  assert.deepEqual(manifest.Actions.map(action => action.UUID), [
    'com.xtruza.streamdock.fusion360.command', 'com.xtruza.streamdock.fusion360.bridge'
  ]);
  const serialized = JSON.stringify(manifest);
  assert.doesNotMatch(serialized, /\/Applications\/Autodesk|Program Files\\Autodesk/i);
});

test('Fusion add-in is valid Python syntax without importing Fusion', () => {
  const source = path.join(root, 'fusion-addin/XtruzaStreamDockBridge/XtruzaStreamDockBridge.py');
  const result = spawnSync(
    'python3',
    ['-c', 'import ast, pathlib, sys; ast.parse(pathlib.Path(sys.argv[1]).read_text())', source],
    { encoding: 'utf8' }
  );
  assert.equal(result.status, 0, result.stderr);
});

test('bundled third-party components retain license notices', () => {
  const notices = fs.readFileSync(path.join(bundle, 'THIRD_PARTY_NOTICES.md'), 'utf8');
  for (const component of ['StreamDock Plugin SDK', 'Bootstrap 5.1.3', 'Bootstrap Icons', 'Axios 1.5.1']) {
    assert.match(notices, new RegExp(component));
  }
  assert.match(notices, /MIT License text/);
});
