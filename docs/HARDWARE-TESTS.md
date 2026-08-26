# MRSVI / StreamDock 293S hardware checklist

Run these checks when the physical device arrives:

- confirm the 144×144 dynamic SVGs render without clipping, aliasing or blank frames;
- verify the 5×3 layout and the three native pages: Sketch, Create/Extrude, Modify;
- measure press-to-command latency in API, shortcut and auto modes;
- verify success/error overlays are visible and do not obscure the next icon update;
- disconnect and reconnect USB, then confirm action contexts and settings recover;
- quit/relaunch Fusion and verify the profile scene activates only while Fusion is foreground;
- stop/restart the Fusion bridge and verify the status key updates;
- test macOS Accessibility permission denial and approval;
- repeat on Windows before declaring cross-platform support stable;
- export the final StreamDock profile only after the 293S layout is confirmed.
