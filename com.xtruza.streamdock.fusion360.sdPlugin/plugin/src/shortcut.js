const MODIFIERS = new Map([
    ['cmd', 'command'], ['command', 'command'], ['meta', 'command'],
    ['ctrl', 'control'], ['control', 'control'],
    ['alt', 'option'], ['option', 'option'], ['shift', 'shift']
]);

function parseShortcut(value) {
    const parts = String(value || '').split('+').map(part => part.trim()).filter(Boolean);
    if (!parts.length) throw new Error('No shortcut configured');
    const key = parts.pop();
    if (!key || key.length > 12) throw new Error('Invalid shortcut key');
    const modifiers = parts.map(part => {
        const normalized = MODIFIERS.get(part.toLowerCase());
        if (!normalized) throw new Error(`Unknown modifier: ${part}`);
        return normalized;
    });
    return { key, modifiers: [...new Set(modifiers)] };
}

function toAppleScript(shortcut) {
    const { key, modifiers } = parseShortcut(shortcut);
    const escaped = key.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const using = modifiers.length ? ` using {${modifiers.map(m => `${m} down`).join(', ')}}` : '';
    return `tell application "System Events" to keystroke "${escaped.toLowerCase()}"${using}`;
}

function toSendKeys(shortcut) {
    const { key, modifiers } = parseShortcut(shortcut);
    const prefix = modifiers.map(m => ({ command: '^', control: '^', option: '%', shift: '+' }[m])).join('');
    const special = { enter: '{ENTER}', escape: '{ESC}', esc: '{ESC}', space: ' ', tab: '{TAB}', delete: '{DELETE}' };
    return `${prefix}${special[key.toLowerCase()] || key.toLowerCase()}`;
}

module.exports = { parseShortcut, toAppleScript, toSendKeys };
