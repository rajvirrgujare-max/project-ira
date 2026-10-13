# IRA V0.6 · Mobile-first PWA

Free, offline-first prototype. No server-side AI, accounts, subscriptions, paid APIs, or analytics. Vanilla HTML/CSS/JS, IndexedDB, Service Worker, Web Speech API. This is a NEW browser app, not a direct import of V0.5 SQLite data.

## Phone-only installation

A ZIP file cannot be installed directly as a PWA. It must be hosted at an HTTPS URL (or localhost) for service workers, speech permissions, and installability. **Never open index.html from file:// expecting offline install.**

**Option A: free GitHub Pages (public source).** On Android Chrome: sign into github.com, create a public repository named `ira-pwa`, upload the *contents* of this extracted ZIP to the repository root (use desktop site if upload is hidden), go to Settings → Pages → Deploy from a branch → main /root → Save. Wait for deployment, then open `https://YOUR_USERNAME.github.io/ira-pwa/` in Chrome. Chrome menu → Add to Home screen / Install app. GitHub Pages publishes source files publicly, so do NOT put secrets, passwords, private data, or personal backup JSON in the repository. User-entered app data stays in the phone's browser storage, not in the GitHub repository. Hosting a static app does not mean its user data is uploaded.

**Option B: local testing using Termux.** Install Termux from its official F-Droid or GitHub release, extract ZIP, run `pkg install python`, `cd /path/to/IRA_V0_6_PWA`, `python -m http.server 8000`, open `http://localhost:8000` in Chrome on the SAME phone. localhost is treated as a secure context for service workers. For long-term installation, HTTPS hosting is easier.

## Use

Chat: `IRA add task edit scene 2`; `IRA आज का प्लान`; `IRA याद रखो keep bluish color grade`; `IRA complete task 1`. Tasks and Memory tabs allow manual entry with projects, priorities, and due dates. Export backup downloads JSON; import merges by ID. Use export regularly because uninstalling the app, clearing Chrome site data, or browser storage eviction can delete local data.

Voice: tap microphone; speech recognition uses browser capabilities and may contact a speech service, requiring internet and possibly sending speech audio to the provider. Offline voice recognition is NOT guaranteed. Hindi/Hinglish recognition accuracy varies by device. Voice playback uses installed browser/system voices and may also vary. The text, tasks, memory, and previously cached app shell work offline after a successful online first load.

## Limitations

- Rule-based command parser, NOT an LLM or general-purpose assistant.
- No automatic Android alarms, background scheduling, push notifications, phone calls, cloud sync, or integrations.
- App must be opened to use tasks; due dates are sorted, not pushed as reminders.
- V0.3/V0.4 Python SQLite data and V0.5 Android SQLite data do not automatically migrate. Import only IRA V0.6 JSON exports.
- Local data is not encrypted beyond browser/device protections. Lock your phone and protect backup files.
- This prototype is not production security audited.

## Tests

`node tests/test.js` tests parser and task sorting. These are not hardware, IndexedDB, service worker, installability, or end-to-end speech tests. Manual phone testing is required.
