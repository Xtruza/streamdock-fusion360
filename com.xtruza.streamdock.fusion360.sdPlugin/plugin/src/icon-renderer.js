function escapeXml(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));
}

function svgData(svg) { return `data:image/svg+xml;charset=utf8,${encodeURIComponent(svg)}`; }

function renderCommandIcon(preset, mode = 'auto') {
    const accent = preset.group === 'Sketch' ? 'rgb(255,212,0)' : preset.group === 'Create' ? 'rgb(255,235,128)' : 'rgb(255,255,255)';
    const transport = mode === 'api' ? 'API' : mode === 'shortcut' ? 'KEY' : 'AUTO';
    return svgData(`<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144"><rect width="144" height="144" rx="18" fill="rgb(8,8,8)"/><path d="M18 18h34M18 18v34M126 126H92M126 126V92" fill="none" stroke="rgb(255,212,0)" stroke-width="5"/><circle cx="72" cy="64" r="35" fill="rgb(17,17,17)" stroke="${accent}" stroke-width="3"/><text x="72" y="75" text-anchor="middle" font-family="Arial" font-size="28" font-weight="900" fill="${accent}">${escapeXml(preset.short)}</text><text x="72" y="118" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700" letter-spacing="1" fill="rgb(164,164,157)">${transport}</text></svg>`);
}

function renderBridgeIcon(ok) {
    const color = ok ? 'rgb(255,212,0)' : 'rgb(120,120,115)';
    return svgData(`<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144"><rect width="144" height="144" rx="18" fill="rgb(8,8,8)"/><path d="M39 71h20m26 0h20M55 54h34v34H55z" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"/><circle cx="72" cy="71" r="7" fill="${color}"/><text x="72" y="119" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700" fill="rgb(255,255,255)">${ok ? 'CONNECTED' : 'OFFLINE'}</text></svg>`);
}

module.exports = { escapeXml, svgData, renderCommandIcon, renderBridgeIcon };
