const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { toAppleScript, toSendKeys } = require('./shortcut');

const execFileAsync = promisify(execFile);

async function frontmostApplication() {
    if (process.platform === 'darwin') {
        const { stdout } = await execFileAsync('/usr/bin/osascript', ['-e', 'tell application "System Events" to get name of first application process whose frontmost is true']);
        return stdout.trim();
    }
    if (process.platform === 'win32') {
        const script = '$s="using System;using System.Runtime.InteropServices;public class W{[DllImport(\"user32.dll\")]public static extern IntPtr GetForegroundWindow();[DllImport(\"user32.dll\")]public static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);}";Add-Type $s;$p=0;[W]::GetWindowThreadProcessId([W]::GetForegroundWindow(),[ref]$p)|Out-Null;(Get-Process -Id $p).ProcessName';
        const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script]);
        return stdout.trim();
    }
    return '';
}

function isFusionApplication(name) {
    return /(^|\s)(autodesk\s+)?fusion(\s*360)?($|\s)/i.test(name || '');
}

async function sendShortcut(shortcut, requireFrontmost = true, options = {}) {
    const current = options.frontmost || await frontmostApplication();
    if (requireFrontmost && !isFusionApplication(current)) throw new Error(`Fusion is not frontmost (${current || 'unknown app'})`);
    if (options.dryRun) return { transport: 'shortcut', message: `Shortcut ready for ${current || 'Fusion'}` };
    if (process.platform === 'darwin') {
        await execFileAsync('/usr/bin/osascript', ['-e', toAppleScript(shortcut)]);
    } else if (process.platform === 'win32') {
        const keys = toSendKeys(shortcut).replace(/'/g, "''");
        await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `Add-Type -AssemblyName System.Windows.Forms;[System.Windows.Forms.SendKeys]::SendWait('${keys}')`]);
    } else {
        throw new Error(`Shortcut mode is not supported on ${process.platform}`);
    }
    return { transport: 'shortcut', message: `Sent ${shortcut}` };
}

module.exports = { frontmostApplication, isFusionApplication, sendShortcut };
