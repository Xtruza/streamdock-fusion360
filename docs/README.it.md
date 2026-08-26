# Xtruza StreamDock per Fusion

Plugin configurabile per comandare Autodesk Fusion da StreamDock su macOS e Windows. Questa prima versione è predisposta per il controller MRSVI/StreamDock 293S, ma non dipende da una disposizione hardware specifica.

## Funzioni

- Azione **Comando Fusion** riutilizzabile con 20 preset.
- Modalità **Automatica**, **API Fusion** o **Scorciatoia** per ogni tasto.
- ID comando e combinazione di tasti sempre modificabili.
- Bridge Python opzionale eseguito dentro Fusion, autenticato e limitato a `127.0.0.1`.
- Controllo dell'app in primo piano prima di inviare una scorciatoia.
- Grafica originale Xtruza nero `#080808` e giallo `#FFD400`.
- Azione separata **Stato bridge**.

## Installazione rapida

1. Scarica e decomprimi una release.
2. Copia `com.xtruza.streamdock.fusion360.sdPlugin` in:
   - macOS: `~/Library/Application Support/HotSpot/StreamDock/plugins/`
   - Windows: `%APPDATA%\HotSpot\StreamDock\plugins\`
3. Riavvia StreamDock.
4. Trascina **Comando Fusion** su un tasto e scegli il comando dal pannello delle proprietà.

La modalità scorciatoia funziona senza bridge. Su macOS StreamDock dovrà avere il permesso **Accessibilità** per simulare la tastiera.

## Bridge API opzionale

Copia `fusion-addin/XtruzaStreamDockBridge` nella cartella AddIns di Fusion e attiva **Esegui all'avvio** dalla finestra **Utility → Script e componenti aggiuntivi**:

- macOS: `~/Library/Application Support/Autodesk/Autodesk Fusion/API/AddIns/`
- Windows: `%APPDATA%\Autodesk\Autodesk Fusion\API\AddIns\`

Il plugin StreamDock trova automaticamente il bridge tramite `~/.xtruza/streamdock-fusion360/bridge.json`: non usa percorsi fissi dell'eseguibile Autodesk.

## Licenze e marchi

Il codice originale Xtruza è distribuito con licenza MIT. Le librerie open
source incluse mantengono i rispettivi avvisi in
[`THIRD_PARTY_NOTICES.md`](../com.xtruza.streamdock.fusion360.sdPlugin/THIRD_PARTY_NOTICES.md).
Autodesk e Fusion sono marchi di Autodesk, Inc.; StreamDock e Mirabox
appartengono ai rispettivi titolari. Questo progetto indipendente non è
affiliato né approvato da tali aziende e non redistribuisce le loro icone.

## Profilo a tre pagine

Crea tre cartelle/pagine native StreamDock: **Schizzo**, **Creazione/Estrusione** e **Modifica**. Duplica l'azione **Comando Fusion** e seleziona un preset diverso per ciascun tasto. La navigazione fra pagine resta nativa StreamDock, quindi è più affidabile e trasportabile.

Associa il profilo/scene all'app Autodesk Fusion. In aggiunta, il plugin impedisce alle scorciatoie di partire quando Fusion non è davanti.

## Stato della prima versione

Tutta la parte testabile senza dispositivo è automatizzata. Quando arriva il 293S restano i controlli elencati in [test hardware](HARDWARE-TESTS.md): dimensioni reali delle icone, navigazione, latenza, feedback e riattivazione della scena.

[Torna al README principale](../README.md)
