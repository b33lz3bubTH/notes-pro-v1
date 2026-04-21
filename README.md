# The Scribe's Codex

A private, offline-first medieval-themed note keeper. Every scroll is sealed
with AES-GCM encryption derived from your password (PBKDF2, 310k rounds) and
stored only inside your browser's IndexedDB. No server, no account, no telemetry.

## Features

- **Encrypted at rest** — title, body, attachment names and bytes are all encrypted
- **Vault unlock** — single password gates the whole codex; lock from the masthead
- **Media relics** — drop, paste (⌘V) or attach images, audio, video, PDFs
- **Standalone editor pages** — open any scroll in a new tab (middle-click)
- **Light & dark** — parchment & ink, or moonlit woodcut
- **Keyboard** — ⌘S to seal, Esc to return to the codex

## Safety helpers (browser console)

```js
window.__scribeWipeNotes() // destroy scrolls + relics, keep your vault password
window.__scribeWipeAll()   // destroy everything, including the vault seal
```
