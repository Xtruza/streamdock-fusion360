import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const bundle = path.join(root, 'com.xtruza.streamdock.fusion360.sdPlugin');
const manifest = JSON.parse(fs.readFileSync(path.join(bundle, 'manifest.json'), 'utf8'));
const errors = [];
const required = ['SDKVersion','Author','Name','Description','Version','Actions','OS','Software'];
for (const field of required) if (manifest[field] === undefined) errors.push(`manifest missing ${field}`);
for (const asset of [manifest.Icon, manifest.CategoryIcon, manifest.CodePathMac, manifest.CodePathWin]) {
  if (!fs.existsSync(path.join(bundle, asset))) errors.push(`missing ${asset}`);
}
for (const action of manifest.Actions) {
  const slug = action.UUID.split('.').pop();
  if (!action.UUID.startsWith('com.xtruza.streamdock.fusion360.')) errors.push(`invalid UUID ${action.UUID}`);
  if (!action.States?.length) errors.push(`missing state for ${action.UUID}`);
  if (!fs.existsSync(path.join(bundle, action.Icon))) errors.push(`missing icon ${action.Icon}`);
  if (action.PropertyInspectorPath && !fs.existsSync(path.join(bundle, action.PropertyInspectorPath))) errors.push(`missing PI ${action.PropertyInspectorPath}`);
  const backend = fs.readFileSync(path.join(bundle, 'plugin/index.js'), 'utf8');
  if (!backend.includes(`plugin.${slug}`)) errors.push(`backend action missing plugin.${slug}`);
}
for (const locale of ['en','it','de','es','fr','ja','ko','pl','pt','ru','zh_CN']) {
  const file = path.join(bundle, `${locale}.json`);
  if (!fs.existsSync(file)) errors.push(`missing locale ${locale}`);
  else JSON.parse(fs.readFileSync(file, 'utf8'));
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Validated ${manifest.Name} ${manifest.Version}: ${manifest.Actions.length} actions, 11 locales.`);
