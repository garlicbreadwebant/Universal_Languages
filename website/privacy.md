# Privacy policy

Effective October 17, 2026. Applies to this Language Library website maintained by GarlicBreadWebAnt and project contributors.

## Learning without an account

You do not need a site account to use the library, dictionaries, flashcards, or local examples. We do not add analytics, advertising, tracking pixels, or third-party scripts. The project has no application server that receives your API keys or conversations.

## Keys, drafts, and conversations

API keys, chat history, text, translations, preferences, and audio stay in the current page's memory. The website does not write them to cookies, localStorage, sessionStorage, IndexedDB, GitHub, or a database. Reloading, leaving the page, or closing the tab clears this page state. Forget key removes one key. Forget all keys & chats clears keys and learning text and cancels pending requests. Export and Copy explicitly place selected text in a download or your clipboard, where it may persist outside the page.

Browser extensions, password managers, operating-system services, or a compromised browser can access or independently retain information. Memory-only storage cannot protect against these. Only enter your key on a site you trust; use provider-side restrictions and spending limits. Do not put secrets in chat messages, attachments, topics, or repository issues.

## Optional AI requests

When you send a chat message, its conversation context, relevant language references, preferences, and any text attachment you included go directly to the selected provider. Changing providers sends that chat context to the new provider on your next request. OpenAI passage generation and translation send your topic or input and the selected language's references to OpenAI. API speech sends the selected text and pronunciation instructions to your chosen speech provider. Keys are sent only in authentication headers to their provider, never in URLs. Requests can incur provider charges.

OpenAI requests set store to false. This does not override provider security, abuse-monitoring, legal, or other retention obligations. We do not control third-party retention, international processing, or training settings. Review your provider's terms and account settings: [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data), [Gemini API terms](https://ai.google.dev/gemini-api/terms), and [Anthropic privacy](https://www.anthropic.com/legal/privacy).

Browser read-aloud uses your browser/device speech service, which may send text to its vendor. No microphone recording is implemented. Text attachments are read locally and included with a chat only after you send it.

## Hosting and external links

GitHub Pages serves the public website. GitHub documents that visitors' IP addresses are logged and stored for security purposes even when visitors are signed out. See [GitHub Pages data collection](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#data-collection) and the [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement). Following external links takes you to services with their own policies.

## Your choices and questions

You can use the reference library without adding an API key, clear the session, choose another provider, or revoke your key at the provider. For provider or hosting records and privacy rights requests, use that service's privacy contact; project maintainers cannot delete those records. Raise site privacy questions through the [project issues](https://github.com/garlicbreadwebant/Universal_Languages/issues). Issues are public: describe the concern without posting keys, personal details, or conversation contents. This policy will be updated when the site's behavior changes.
