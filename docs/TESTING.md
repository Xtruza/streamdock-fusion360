# Software-only testing

## Automated

`npm run check` verifies:

- manifest syntax, UUIDs, action/backend coupling and referenced files;
- all 11 localization files required by the StreamDock template;
- absence of fixed Autodesk executable paths;
- shortcut parsing and platform conversions;
- dependency-free local WebSocket framing;
- Fusion foreground-window detection;
- preset uniqueness and generated SVG data URLs;
- Python syntax for the Fusion add-in.

CI repeats the checks on every push and pull request and uploads a development ZIP artifact. The plugin runtime uses only Node 20 built-ins and does not require an npm bundle.

## Manual without a 293S

1. Open the Property Inspector through StreamDock's local inspector surface.
2. Change presets and confirm settings persist after closing/reopening the panel.
3. Run the bridge add-in in Fusion and press **Test configuration**.
4. Verify `Bridge Status` changes between offline and connected.
5. In shortcut mode, focus another app and verify the action fails instead of typing into it.
6. Focus Fusion and verify configured shortcuts.

Do not treat command-ID success as final until it has been tested on the target Fusion version.
