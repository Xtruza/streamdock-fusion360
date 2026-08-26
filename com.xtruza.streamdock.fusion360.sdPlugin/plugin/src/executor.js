const { getPreset } = require('./catalog');
const { requestBridge, checkBridge } = require('./bridge-client');
const { sendShortcut } = require('./platform');

function resolveCommand(settings = {}) {
    const preset = getPreset(settings.preset);
    return {
        commandId: settings.commandId || preset.commandId,
        shortcut: settings.shortcut ?? preset.shortcut,
        requireFusionFrontmost: settings.requireFusionFrontmost !== false
    };
}

async function executeCommand(settings = {}, options = {}) {
    const command = resolveCommand(settings);
    const mode = settings.mode || 'auto';
    if (options.dryRun) {
        if (mode !== 'shortcut') {
            const bridge = await checkBridge();
            if (bridge.ok) return { transport: 'api', message: 'Fusion API bridge connected' };
            if (mode === 'api') throw new Error(bridge.error || 'Fusion API bridge unavailable');
        }
        if (!command.shortcut) throw new Error('No fallback shortcut configured');
        return { transport: 'shortcut', message: `Fallback shortcut: ${command.shortcut}` };
    }
    if (mode !== 'shortcut') {
        try {
            await requestBridge('POST', '/v1/commands/execute', { commandId: command.commandId });
            return { transport: 'api' };
        } catch (error) {
            if (mode === 'api') throw error;
        }
    }
    if (!command.shortcut) throw new Error('No shortcut configured for fallback');
    return sendShortcut(command.shortcut, command.requireFusionFrontmost);
}

module.exports = { resolveCommand, executeCommand };
