# IRA V0.9.4 · Draft Schedule Engine

Offline-first Android PWA. ₹0 API cost. No generative AI service.

## Upgrade
Replace the seven root files in GitHub Pages main/root, keeping icons/ untouched. Do not upload backups or personal JSON to public GitHub. The IndexedDB name `ira-v06` and version 1 remain unchanged, retaining existing tasks, memories and messages on the same browser/origin. Export a backup before updating.

## New
- Recent chat history is read from existing IndexedDB messages for follow-up handling.
- After a missed-deadline question, a reply such as "Storyboard के 7 scenes पूरे नहीं हुए हैं" is connected to the preceding project and deadline.
- IRA asks for missing scene details rather than inventing them or automatically editing tasks.
- Previous V0.8 personality, voice, tasks and memory features retained.
- This is limited rule-based context tracking, not a generative conversational model.

## Tests
`node tests/test.js` and `node tests/context.test.js`.
Test on Android by describing a missed deadline for The Last Coin and replying with pending storyboard scenes. Reopen app and repeat. Voice transcription accuracy depends on browser services.
