const { Plugins, Actions, log } = require('./utils/plugin');
const { PRESETS, getPreset } = require('./src/catalog');
const { executeCommand } = require('./src/executor');
const { checkBridge } = require('./src/bridge-client');
const { renderCommandIcon, renderBridgeIcon } = require('./src/icon-renderer');

const plugin = new Plugins();
const commandDefaults = {
    preset: 'extrude', mode: 'auto', commandId: 'FusionExtrudeCommand', shortcut: 'E', requireFusionFrontmost: true
};

plugin.command = new Actions({
    default: commandDefaults,
    _willAppear({ context }) { refreshCommandKey(context, this.data[context]); },
    _didReceiveSettings({ context }) { refreshCommandKey(context, this.data[context]); },
    async keyUp({ context }) {
        const settings = this.data[context];
        try {
            const result = await executeCommand(settings);
            log.info('Command executed', { preset: settings.preset, transport: result.transport });
            plugin.showOk(context);
        } catch (error) {
            log.error('Command failed', error);
            plugin.showAlert(context);
        }
    },
    async sendToPlugin({ context, payload }) {
        if (payload?.event !== 'test') return;
        try {
            const result = await executeCommand(this.data[context], { dryRun: true });
            plugin.sendToPropertyInspector({ event: 'testResult', ok: true, message: result.message });
        } catch (error) {
            plugin.sendToPropertyInspector({ event: 'testResult', ok: false, message: error.message });
        }
    }
});

plugin.bridge = new Actions({
    default: {},
    _willAppear({ context }) { refreshBridgeKey(context); },
    keyUp({ context }) { refreshBridgeKey(context, true); }
});

plugin.applicationDidLaunch = () => Object.keys(plugin.bridge.data).forEach(context => refreshBridgeKey(context));
plugin.applicationDidTerminate = () => Object.keys(plugin.bridge.data).forEach(context => refreshBridgeKey(context));

function refreshCommandKey(context, settings) {
    plugin.setImage(context, renderCommandIcon(getPreset(settings.preset), settings.mode));
}

async function refreshBridgeKey(context, flash = false) {
    const status = await checkBridge();
    plugin.setImage(context, renderBridgeIcon(status.ok));
    if (flash) status.ok ? plugin.showOk(context) : plugin.showAlert(context);
}

module.exports = { PRESETS, commandDefaults, refreshCommandKey };
