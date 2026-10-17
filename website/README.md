# Language library

Open [index.html](index.html) in a browser. The library, flashcards, and reference pages work directly from disk without installation or a network connection. Optional AI chat and API speech need internet access and your own provider API key. HTTPS hosting (including GitHub Pages) is recommended for API features; provider CORS and key restrictions can prevent requests from local files.

## Flashcards

Choose **Flashcards** in the navigation for either Lumena or Narela. Cards use that language's dictionary, including usage notes. Filter by category, choose English or the language as the prompt, reveal answers, move backward or forward, and shuffle the deck. Moving to another card hides the answer; the deck wraps at either end. Switching languages starts a fresh deck. Flashcards work offline and progress lasts for the current visit to the section.

## Refresh content

The language folders are the source of truth; data.js is a generated snapshot that makes direct file opening possible. From the workspace root, after editing either language:

```powershell
node Narela/tools/check_language.cjs --write
node Lumena/tools/check_language.cjs --write
node website/build-data.cjs
node website/check-site.cjs
```

Use node website/build-data.cjs --check to detect a stale snapshot without writing it. The builder consumes both lexicons and all six reference documents per language. It never edits their source files. AI translation and pronunciation are approximate, not authoritative language references.

## AI chat and speech

Open **AI settings** and select OpenAI, Gemini, or Claude. Paste a key into the password field and choose **Apply for this session**. The model ID can be changed to a model available to your account. API billing is separate from consumer chat subscriptions. Use provider-side spending limits and least-privilege key restrictions.

The **Chat companion** page includes streaming replies, stop, retry/regenerate, edit-and-resend, safe formatted text, copy, read aloud, Markdown export, new/rename/delete/search conversations, drafts, and tutor/conversation/translation/quiz modes. Text, Markdown, and CSV files up to 12 KB can be inserted into the draft with **Attach text** and reviewed before sending. Combined messages are limited to 12,000 characters. Each language has its own conversations. Requests include that language's pronunciation, grammar, lessons, vocabulary, and up to the most recent 40 nonempty messages (100,000 history characters maximum). The full chat remains available to export. There is no browsing, tool execution, image generation, or image/PDF attachment processing.

The **Read aloud** page accepts up to 3,000 characters. Dictionary entries, flashcards, chat messages, and the **Read selection** control also support listening. Speech is independent of the chat provider: use an OpenAI key, a Gemini key, or the browser's built-in speech service. Add multiple providers' keys by applying one provider's settings at a time. Claude has no native speech adapter in this site, so Claude chat can use browser speech or a separate OpenAI/Gemini key. Audio playback has native pause/seek controls, a speed setting, and a stop/dismiss action. Generated audio URLs are revoked when dismissed or replaced.

API speech includes the language's pronunciation guide as delivery instructions. Browser speech uses the browser/device voice and cannot be taught these rules. All voices are synthetic and may mispronounce constructed words; compare with the written guide. A browser speech service may send text to its vendor and may not work offline.

### Key and conversation privacy

- Keys are held in a private JavaScript closure in the current page, never in localStorage, sessionStorage, cookies, IndexedDB, URLs, chat exports, source files, or GitHub. The password field is emptied after applying settings. No key validation request is made automatically.
- Reloading, leaving the page, or closing the tab forgets keys, conversations, and drafts. The `pagehide` handler also clears them before the browser can restore a page from its back/forward cache. **Forget key** removes one key; **Forget all keys & chats** clears session data and cancels requests/audio. Exporting a chat explicitly downloads its text without credentials.
- Requests go directly to the selected provider's fixed HTTPS API host, with credentials in headers. Gemini keys are not put in query strings. No proxy, analytics, third-party script, automatic retry, or server-side chat storage is used by this site. OpenAI Responses requests set `store: false`; this does not override provider abuse-monitoring or other retention policies.
- Providers receive submitted conversation text and language references; speech providers receive the selected text and pronunciation instructions. Provider data handling still applies. Changing the chat provider sends the active conversation's context to the newly selected provider on the next send.
- A public GitHub Pages site does not share one visitor's page memory with other visitors. However, memory-only keys are **not protected from scripts running on the page, malicious extensions, a compromised site/browser, or someone with access to your device**. Browser password managers may independently offer to save pasted credentials; decline that option. The page disables autocomplete, loads only bundled scripts, escapes generated content, and restricts connections with a Content Security Policy. Do not add untrusted scripts or arbitrary proxy URLs to this design.
- Authentication, billing/quota, unsupported models, CORS/network errors, interrupted streams, and timeouts show actionable messages. Raw provider error bodies are not shown or logged because they may contain sensitive information. A stopped request may still incur charges for work the provider has already performed.

Provider references: [OpenAI streaming](https://developers.openai.com/api/docs/guides/streaming-responses), [OpenAI speech](https://developers.openai.com/api/docs/guides/text-to-speech), [Gemini text generation](https://ai.google.dev/gemini-api/docs/generate-content/text-generation), [Gemini speech](https://ai.google.dev/gemini-api/docs/generate-content/speech-generation), and [Anthropic browser request headers](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/src/client.ts). Model availability changes; the editable defaults are starting points, not guarantees of account access.

### Validation

`node website/check-site.cjs` includes dependency-free mocked-provider checks in `check-ai.cjs`. Build with `node website/build-site.cjs`, then optionally run `node website/check-browser.cjs` with Chrome installed (set `CHROME_PATH` if necessary). The browser checks use synthetic keys and local simulated streams, never paid API calls. Desktop/mobile screenshots are written into the ignored `.site-build/` directory. Live provider availability and pronunciation quality require a user's own key and listening review.

On Windows, Git's automatic CRLF conversion can make the existing dictionary/snapshot freshness checks report unchanged generated files as stale. Use an LF checkout for the standard validation workflow.

## Files

- index.html: semantic page structure and navigation.
- styles.css: responsive layouts, readable type, focus states, and print styles.
- app.js: browser rendering and interactions.
- ai-client.js: provider payloads, streaming, safe errors, speech and audio conversion.
- ai-ui.js / ai.css: session-only keys, chat, speech and accessible settings.
- data.js: generated language content, loaded as a classic script for file compatibility.
- build-data.cjs: standard-library-only content builder.
- check-site.cjs: source and behavior checks.

Layout uses system fonts and CSS shapes. There are no third-party runtime dependencies, tracking, or site accounts. AI features contact a provider only after an explicit user action.

## GitHub Pages

`node website/build-site.cjs` stages public assets and language references in `.site-build/`, with paths adjusted for hosting at the repository URL. GitHub Actions runs validation and builds this directory before publishing it through GitHub Pages. Pull requests run the same checks without deploying. Keep Pages configured to use GitHub Actions.
