# IRA V0.7 Intelligent Brain (offline rules)

Install/update: replace GitHub repository root files with this ZIP contents (do not upload ZIP itself). Keep icons in icons/. GitHub Pages on main /root remains unchanged. Wait for deployment and reload the PWA; if stale, close and reopen Chrome.

**Before update:** Export backup from the existing V0.6 app. Never commit the JSON backup to public GitHub.

Compatibility: IndexedDB name `ira-v06`, schema version 1 and stores tasks/memories/messages intentionally remain unchanged. Existing device data is retained on the same origin/browser profile. Both `ira-v06` and `ira-v07` JSON backup formats import. Export uses `ira-v07`.

New offline Hindi/Hinglish variants, project recognition for The Last Coin, Insomniac and Project IRA, project-filtered plan and memories. This is **not** a generative AI or true conversational memory model. Speech recognition may need internet or browser services; offline text tasks and memory work after PWA assets are cached.

Tests: `node tests/test.js`. Test on Android: open app, check existing task, add task via voice/text, request project plan, close/reopen, try airplane mode for text operations, export new backup.
