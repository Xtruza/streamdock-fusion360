const PRESETS = [
    { id: 'create-sketch', group: 'Sketch', label: 'Create Sketch', short: 'SK', commandId: 'FusionCreateSketchCommand', shortcut: '' },
    { id: 'line', group: 'Sketch', label: 'Line', short: 'LN', commandId: 'SketchLineCmd', shortcut: 'L' },
    { id: 'rectangle', group: 'Sketch', label: 'Rectangle', short: 'RC', commandId: 'SketchTwoPointRectangleCmd', shortcut: 'R' },
    { id: 'circle', group: 'Sketch', label: 'Circle', short: 'CI', commandId: 'SketchCenterPointCircleCmd', shortcut: 'C' },
    { id: 'dimension', group: 'Sketch', label: 'Dimension', short: 'DM', commandId: 'SketchGeneralDimensionCmd', shortcut: 'D' },
    { id: 'trim', group: 'Sketch', label: 'Trim', short: 'TR', commandId: 'SketchTrimCmd', shortcut: 'T' },
    { id: 'offset', group: 'Sketch', label: 'Offset', short: 'OF', commandId: 'SketchOffsetCmd', shortcut: 'O' },
    { id: 'project', group: 'Sketch', label: 'Project', short: 'PJ', commandId: 'SketchProjectGeometryCmd', shortcut: 'P' },
    { id: 'extrude', group: 'Create', label: 'Extrude', short: 'EX', commandId: 'FusionExtrudeCommand', shortcut: 'E' },
    { id: 'revolve', group: 'Create', label: 'Revolve', short: 'RV', commandId: 'FusionRevolveCommand', shortcut: '' },
    { id: 'sweep', group: 'Create', label: 'Sweep', short: 'SW', commandId: 'FusionSweepCommand', shortcut: '' },
    { id: 'loft', group: 'Create', label: 'Loft', short: 'LF', commandId: 'FusionLoftCommand', shortcut: '' },
    { id: 'hole', group: 'Create', label: 'Hole', short: 'HL', commandId: 'FusionHoleCommand', shortcut: 'H' },
    { id: 'fillet', group: 'Modify', label: 'Fillet', short: 'FL', commandId: 'FusionFilletCommand', shortcut: 'F' },
    { id: 'chamfer', group: 'Modify', label: 'Chamfer', short: 'CH', commandId: 'FusionChamferCommand', shortcut: '' },
    { id: 'shell', group: 'Modify', label: 'Shell', short: 'SH', commandId: 'FusionShellCommand', shortcut: '' },
    { id: 'combine', group: 'Modify', label: 'Combine', short: 'CB', commandId: 'FusionCombineCommand', shortcut: '' },
    { id: 'move', group: 'Modify', label: 'Move / Copy', short: 'MV', commandId: 'FusionMoveCommand', shortcut: 'M' },
    { id: 'measure', group: 'Inspect', label: 'Measure', short: 'ME', commandId: 'FusionMeasureCommand', shortcut: 'I' },
    { id: 'parameters', group: 'Modify', label: 'Parameters', short: 'FX', commandId: 'FusionChangeParametersCommand', shortcut: '' }
];

function getPreset(id) {
    return PRESETS.find(item => item.id === id) || PRESETS.find(item => item.id === 'extrude');
}

module.exports = { PRESETS, getPreset };
