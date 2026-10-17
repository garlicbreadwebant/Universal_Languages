/* All keys, chats, drafts and audio live only in this page's memory. */
(function (global) {
  'use strict';
  const api = global.LanguageAIClient;
  if (!global.document || !api) return;
  const $ = id => document.getElementById(id);
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  let keys = Object.create(null);
  const settings = {provider: 'openai', models: Object.fromEntries(Object.entries(api.providers).map(([id, p]) => [id, p.model])), speech: 'browser', voices: {openai: 'coral', gemini: 'Kore'}, speechModels: {openai: api.providers.openai.speechModel, gemini: api.providers.gemini.speechModel}, rate: 1, maxTokens: 2048, instructions: ''};
  let conversations = [], activeId = null, sequence = 0, mounted = null, chatJob = null, speechJob = null, audioURL = null, audioLanguage = null;
  let historyQuery = '', lastFocus = null, speechSequence = 0;
  let studioJob = null;
  function stopStudio() {
    const job = studioJob;
    if (!job) return;
    studioJob = null; job.controller.abort(); job.cancelUI();
  }
  const languageId = () => Object.hasOwn(global.LANGUAGE_DATA, location.hash.slice(1).split('/')[0]) ? location.hash.slice(1).split('/')[0] : 'lumena';
  const language = () => global.LANGUAGE_DATA[languageId()];
  const current = () => conversations.find(c => c.id === activeId && c.language === languageId());
  const scrub = text => Object.values(keys).filter(Boolean).reduce((result, key) => result.split(key).join('[API key removed]'), String(text));
  const announce = text => { $('announcement').textContent = text; };
  const providerOptions = selected => Object.entries(api.providers).map(([id, p]) => `<option value="${id}"${id === selected ? ' selected' : ''}>${p.name}</option>`).join('');
  const formatMessage = text => global.LanguageLibraryMarkdown ? global.LanguageLibraryMarkdown(text, languageId()) : esc(text);
  document.body.insertAdjacentHTML('beforeend', `
    <div class="ai-tools" aria-label="AI learning tools"><button type="button" id="ai-read-selection">Read selection</button><button type="button" id="ai-open-settings">AI settings</button><a id="ai-chat-link" href="#lumena/chat">Chat companion <span aria-hidden="true">↗</span></a></div>
    <section id="speech-player" class="speech-player" aria-label="Read aloud" hidden><div><strong>Read aloud</strong><span id="speech-status" role="status"></span></div><audio id="speech-audio" controls hidden></audio><button type="button" id="speech-stop">Stop / dismiss</button></section>
    <dialog id="ai-settings" aria-labelledby="ai-settings-title"><form id="ai-settings-form" autocomplete="off"><div class="ai-dialog-heading"><div><p class="eyebrow">YOUR OWN CONNECTION</p><h2 id="ai-settings-title">AI settings</h2></div><button type="button" id="ai-close-settings" aria-label="Close AI settings">Close</button></div>
      <p class="privacy-note">Keys stay in this page's memory until you reload, leave, or close the tab. No keys or conversations are saved to GitHub or browser storage. Requests go directly to your selected provider and may incur API charges.</p>
      <p class="ai-fineprint">Only use a site you trust. Page scripts and browser extensions can access browser-held keys. Your provider receives submitted text and language references under its own data policies. Use a restricted key with a spending limit. Chat subscriptions do not necessarily include API access.</p>
      <fieldset><legend>Chat connection</legend><div class="ai-fields"><div class="field"><label for="ai-provider">Provider</label><select id="ai-provider">${providerOptions(settings.provider)}</select></div><div class="field"><label for="ai-model">Chat model ID</label><input id="ai-model" required maxlength="100" spellcheck="false"></div></div>
      <div class="field"><label for="ai-key">API key for <span id="ai-key-provider">OpenAI</span></label><div class="search-wrap"><input id="ai-key" type="password" autocomplete="off" spellcheck="false" autocapitalize="none" aria-describedby="ai-key-state" placeholder="Paste your API key"><button type="button" id="ai-forget-key">Forget key</button></div><p id="ai-key-state" class="ai-fineprint" role="status"></p></div>
      <div class="ai-fields"><div class="field"><label for="ai-length">Maximum response tokens</label><select id="ai-length"><option value="1024">Short · 1,024</option><option value="2048">Standard · 2,048</option><option value="4096">Long · 4,096</option><option value="8192">Extended · 8,192</option></select></div><div class="field"><label for="ai-instructions">Learning preferences (optional)</label><textarea id="ai-instructions" maxlength="2000" rows="2" placeholder="For example: explain grammar in simple English"></textarea></div></div></fieldset>
      <fieldset><legend>Read aloud</legend><div class="ai-fields"><div class="field"><label for="ai-speech-provider">Speech provider</label><select id="ai-speech-provider"><option value="browser">Browser voice · no key needed</option><option value="openai">OpenAI · API key required</option><option value="gemini">Gemini · API key required</option></select></div><div class="field"><label for="ai-rate">Playback speed</label><select id="ai-rate"><option value="0.75">0.75× · slower</option><option value="1">1× · normal</option><option value="1.25">1.25× · faster</option></select></div></div>
      <div id="ai-cloud-speech"><div class="ai-fields"><div class="field"><label for="ai-speech-model">Speech model ID</label><input id="ai-speech-model" maxlength="100" spellcheck="false"></div><div class="field"><label for="ai-voice">Voice</label><select id="ai-voice"></select></div></div><p class="ai-fineprint">Speech uses the key for its own provider. Select that provider above to add its key, then switch back to your preferred chat provider.</p></div>
      <p class="ai-fineprint">Claude chat works with any of these speech options. Browser speech uses your device/browser's speech service, which may send text online. All speech is synthetic. Pronunciation of Lumena and Narela is approximate; the written pronunciation guide is the reference.</p></fieldset>
      <p id="ai-settings-status" role="status"></p><div class="ai-dialog-actions"><button type="button" id="ai-forget-all" class="ai-danger">Forget all keys & chats</button><button class="button" type="submit">Apply for this session</button></div></form></dialog>`);
  function refreshKeyState() {
    const provider = $('ai-provider').value;
    $('ai-key-provider').textContent = api.providers[provider].name;
    $('ai-key-state').textContent = keys[provider] ? 'Key available in this page. Paste a new key to replace it.' : 'No key added for this provider.';
    $('ai-key').value = '';
    $('ai-key').placeholder = keys[provider] ? 'Key in memory · paste to replace' : 'Paste your API key';
  }
  function refreshSpeechSettings() {
    const provider = $('ai-speech-provider').value;
    $('ai-cloud-speech').hidden = provider === 'browser';
    if (provider === 'browser') return;
    $('ai-speech-model').value = settings.speechModels[provider];
    $('ai-voice').innerHTML = api.providers[provider].voices.map(voice => `<option${voice === settings.voices[provider] ? ' selected' : ''}>${voice}</option>`).join('');
  }
  function openSettings(providerOverride) {
    lastFocus = document.activeElement;
    const provider = Object.hasOwn(api.providers, providerOverride) ? providerOverride : settings.provider;
    $('ai-provider').value = provider;
    $('ai-model').value = settings.models[provider];
    $('ai-length').value = String(settings.maxTokens);
    $('ai-instructions').value = settings.instructions;
    $('ai-speech-provider').value = settings.speech;
    $('ai-rate').value = String(settings.rate);
    $('ai-settings-status').textContent = '';
    refreshKeyState(); refreshSpeechSettings(); $('ai-settings').showModal();
  }
  $('ai-open-settings').addEventListener('click', openSettings);
  $('ai-close-settings').addEventListener('click', () => $('ai-settings').close());
  $('ai-settings').addEventListener('close', () => { $('ai-key').value = ''; lastFocus?.focus(); });
  $('ai-provider').addEventListener('change', () => {
    $('ai-model').value = settings.models[$('ai-provider').value]; refreshKeyState();
    $('ai-settings-status').textContent = 'Provider changed. Apply settings before switching again to keep a newly pasted key.';
  });
  $('ai-speech-provider').addEventListener('change', refreshSpeechSettings);
  $('ai-forget-key').addEventListener('click', () => {
    const provider = $('ai-provider').value;
    delete keys[provider]; stopChat(); stopSpeech(); stopStudio(); refreshKeyState();
    $('ai-settings-status').textContent = 'Key removed from this page.';
  });
  $('ai-settings-form').addEventListener('submit', event => {
    event.preventDefault();
    const provider = $('ai-provider').value, speech = $('ai-speech-provider').value;
    try {
      api.modelId($('ai-model').value.trim());
      if (speech !== 'browser') api.modelId($('ai-speech-model').value.trim());
      const key = $('ai-key').value.trim();
      if (key && /\s/.test(key)) throw new Error('API keys cannot contain spaces or line breaks.');
      stopChat(); stopSpeech(); stopStudio();
      if (key) keys[provider] = key;
      settings.provider = provider; settings.models[provider] = $('ai-model').value.trim();
      settings.maxTokens = Number($('ai-length').value); settings.instructions = $('ai-instructions').value;
      settings.speech = speech; settings.rate = Number($('ai-rate').value);
      if (speech !== 'browser') { settings.voices[speech] = $('ai-voice').value; settings.speechModels[speech] = $('ai-speech-model').value.trim(); }
      $('ai-settings').close();
      if ($('studio-connection')) $('studio-connection').textContent = `OpenAI / ${settings.models.openai}. Uses your OpenAI key independently of chat and speech provider choices.`;
      if (mounted && document.contains(mounted) && location.hash.endsWith('/chat')) mountChat(mounted, language());
      announce('AI settings applied for this page session.');
    } catch (error) { $('ai-settings-status').textContent = error.message; }
  });
  function forgetAll() {
    stopChat(); stopSpeech(); stopStudio(); keys = Object.create(null); conversations = []; activeId = null;
    for (const id of ['speech-text', 'studio-topic', 'studio-english']) if ($(id)) $(id).value = '';
    for (const id of ['studio-translation', 'studio-ai-notes', 'studio-ai-status']) if ($(id)) $(id).textContent = '';
    if ($('studio-translation-toggle')) { $('studio-translation-toggle').hidden = false; $('studio-translation-toggle').textContent = 'Translate to English'; $('studio-translation-toggle').setAttribute('aria-expanded', 'false'); }
    settings.instructions = ''; historyQuery = '';
    $('ai-key').value = ''; $('ai-instructions').value = '';
    refreshKeyState();
    if (mounted && document.contains(mounted) && location.hash.endsWith('/chat')) mountChat(mounted, language());
  }
  $('ai-forget-all').addEventListener('click', () => { forgetAll(); $('ai-settings-status').textContent = 'All keys, conversations, attachments, and drafts removed.'; });
  function stopSpeech() {
    speechSequence++;
    speechJob?.abort(); speechJob = null;
    global.speechSynthesis?.cancel();
    const audio = $('speech-audio'); audio.pause(); audio.removeAttribute('src'); audio.load(); audio.hidden = true;
    if (audioURL) URL.revokeObjectURL(audioURL);
    audioURL = null; audioLanguage = null; $('speech-player').hidden = true;
  }
  $('speech-stop').addEventListener('click', stopSpeech);
  async function speak(text, lang = language()) {
    stopSpeech(); const token = speechSequence;
    text = scrub(text).trim();
    $('speech-player').hidden = false; audioLanguage = lang.name;
    const status = $('speech-status');
    if (!text || text.length > 3000) { status.textContent = 'Select between 1 and 3,000 characters to read aloud.'; return; }
    if (settings.speech === 'browser') {
      if (!global.speechSynthesis || !global.SpeechSynthesisUtterance) { status.textContent = 'Browser speech is unavailable. Choose OpenAI or Gemini in AI settings.'; return; }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = settings.rate;
      status.textContent = 'Browser voice · approximate pronunciation';
      utterance.onend = () => { if (token === speechSequence) status.textContent = 'Finished · browser voice'; };
      utterance.onerror = () => { if (token === speechSequence) status.textContent = 'Browser speech could not play. Try an API speech provider.'; };
      global.speechSynthesis.speak(utterance); return;
    }
    const provider = settings.speech;
    if (!keys[provider]) { status.textContent = `Add your ${api.providers[provider].name} key in AI settings to use this speech provider.`; openSettings(); return; }
    const controller = new AbortController(); speechJob = controller;
    const timeout = setTimeout(() => controller.abort(), 120000);
    status.textContent = 'Generating AI speech…';
    try {
      const blob = await api.speech({provider, key: keys[provider], text, lang, voice: settings.voices[provider], model: settings.speechModels[provider], signal: controller.signal});
      if (token !== speechSequence || controller.signal.aborted) return;
      audioURL = URL.createObjectURL(blob);
      const audio = $('speech-audio'); audio.src = audioURL; audio.hidden = false; audio.playbackRate = settings.rate;
      status.textContent = `${api.providers[provider].name} AI voice · approximate pronunciation`;
      await audio.play().catch(() => { if (token === speechSequence) status.textContent = 'AI speech ready. Press play to listen.'; });
    } catch (error) {
      if (token === speechSequence) status.textContent = error.name === 'AbortError' ? 'Speech generation timed out. Try a shorter text.' : error.message;
    } finally { clearTimeout(timeout); if (speechJob === controller) speechJob = null; }
  }
  $('ai-read-selection').addEventListener('click', () => speak(global.getSelection()?.toString() || ''));
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-speak]');
    if (button) speak(button.dataset.speak);
  });
  function newConversation() {
    stopChat();
    const chat = {id: ++sequence, language: languageId(), title: 'New conversation', messages: [], draft: '', mode: 'tutor'};
    conversations.unshift(chat); activeId = chat.id; return chat;
  }
  function stopChat() { chatJob?.controller.abort(); }
  function isChatVisible(chat) { return mounted && document.contains(mounted) && current() === chat && location.hash.endsWith('/chat'); }
  function download(text, filename) {
    const url = URL.createObjectURL(new Blob([text], {type: 'text/markdown;charset=utf-8'}));
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(scrub(text)); announce('Message copied.'); }
    catch { announce('Clipboard unavailable. Select the message text and copy it.'); }
  }
  function renderHistory() {
    const list = $('chat-history'); if (!list) return;
    list.innerHTML = conversations.filter(c => c.language === languageId() && (!historyQuery || `${c.title} ${c.messages.map(m => m.content).join(' ')}`.toLowerCase().includes(historyQuery.toLowerCase()))).map(c => `<button type="button" data-chat-id="${c.id}"${c.id === activeId ? ' aria-current="true"' : ''}>${esc(c.title)}</button>`).join('') || '<p class="ai-fineprint">No conversations found.</p>';
    list.querySelectorAll('[data-chat-id]').forEach(button => button.addEventListener('click', () => {
      stopChat(); activeId = Number(button.dataset.chatId); mountChat(mounted, language()); $('chat-input').focus();
    }));
  }
  function renderMessages() {
    const chat = current(), log = $('chat-messages'); if (!chat || !log) return;
    const nearBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 100;
    log.innerHTML = chat.messages.length ? chat.messages.map((m, i) => `<article class="chat-message ${m.role}" aria-label="${m.role === 'user' ? 'Your message' : 'Companion message'}"><div class="message-label">${m.role === 'user' ? 'You' : 'Companion'}${m.model ? ` <span>${esc(m.provider)} / ${esc(m.model)}</span>` : ''}</div><div class="message-content">${formatMessage(m.content || (chatJob?.chat === chat ? 'Thinking…' : 'No response received.'))}</div>${m.notice ? `<p class="message-notice">${esc(m.notice)}</p>` : ''}<div class="message-actions"><button type="button" data-copy="${i}">Copy</button>${m.content ? `<button type="button" data-read="${i}">Read aloud</button>` : ''}${m.role === 'user' ? `<button type="button" data-edit="${i}"${chatJob ? ' disabled' : ''}>Edit & resend</button>` : ''}</div></article>`).join('') : `<div class="chat-welcome"><span class="chat-emblem" aria-hidden="true">a</span><h2>A conversation starts here.</h2><p>Explore ${esc(language().name)} with a companion that has the project's vocabulary, grammar, and pronunciation guide.</p><div class="chat-suggestions"><button type="button" data-prompt="Teach me five useful greetings with English meanings.">Learn useful greetings ↗</button><button type="button" data-prompt="Start a simple conversation with me. Include English glosses.">Practice a conversation ↗</button><button type="button" data-prompt="Quiz me on five everyday words, one at a time.">Try a vocabulary quiz ↗</button><button type="button" data-prompt="Explain how to build a simple sentence, using attested examples.">Explore sentence patterns ↗</button></div></div>`;
    log.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', () => copy(chat.messages[Number(b.dataset.copy)].content)));
    log.querySelectorAll('[data-read]').forEach(b => b.addEventListener('click', () => speak(chat.messages[Number(b.dataset.read)].content)));
    log.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => editMessage(Number(b.dataset.edit))));
    log.querySelectorAll('[data-prompt]').forEach(b => b.addEventListener('click', () => { $('chat-input').value = b.dataset.prompt; chat.draft = b.dataset.prompt; $('chat-input').focus(); }));
    if (nearBottom) log.scrollTop = log.scrollHeight;
    $('chat-regenerate').disabled = !!chatJob || !chat.messages.some(m => m.role === 'user');
  }
  function setBusy() {
    const busy = !!chatJob;
    if (!$('chat-send')) return;
    $('chat-send').disabled = busy; $('chat-stop').hidden = !busy;
    $('chat-regenerate').disabled = busy || !current()?.messages.some(m => m.role === 'user');
    $('chat-state').textContent = busy ? 'Generating… You can stop the response.' : 'Ready';
    $('chat-messages').setAttribute('aria-busy', String(busy));
  }
  function editMessage(index) {
    const chat = current(); if (chatJob || !chat) return;
    chat.editIndex = index; chat.draft = chat.messages[index].content;
    $('chat-input').value = chat.draft; $('chat-input').focus();
    $('chat-cancel-edit').hidden = false;
    $('chat-error').textContent = 'Editing a message. Sending replaces this message and all replies after it.';
  }
  async function generate(chat) {
    if (chatJob) return;
    const provider = settings.provider, key = keys[provider];
    if (!key) { openSettings(); return; }
    const controller = new AbortController();
    const job = {controller, chat}; chatJob = job;
    const reply = {role: 'assistant', content: '', provider: api.providers[provider].name, model: settings.models[provider]};
    // Bound history explicitly; the full conversation remains available in the UI/export.
    let turns = chat.messages.filter(m => m.content).slice(-40).map(m => ({role: m.role, content: scrub(m.content)}));
    while (turns.length && turns[0].role !== 'user') turns.shift();
    if (turns.reduce((n, m) => n + m.content.length, 0) > 100000) {
      chatJob = null; $('chat-error').textContent = 'Conversation context is too large. Start a new chat or shorten your messages.'; return;
    }
    chat.messages.push(reply); renderMessages(); setBusy();
    if (chat.messages.length > 41) $('chat-error').textContent = 'Only the most recent 40 messages are included with this request.';
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 180000);
    try {
      const notice = await api.chat({provider, key, model: reply.model, system: api.languageContext(global.LANGUAGE_DATA[chat.language], chat.mode, settings.instructions), messages: turns, maxTokens: settings.maxTokens, signal: controller.signal,
        onDelta(delta) { if (!controller.signal.aborted) { reply.content += scrub(delta); if (isChatVisible(chat)) renderMessages(); } }});
      reply.notice = notice || (!reply.content ? 'No text returned. Try a different prompt or model.' : '');
    } catch (error) {
      reply.notice = error.name === 'AbortError' ? (timedOut ? 'Request timed out. Retry when ready.' : 'Response stopped. Partial text has been kept.') : error.message;
    } finally {
      clearTimeout(timeout);
      if (chatJob === job) chatJob = null;
      if (mounted && document.contains(mounted) && location.hash.endsWith('/chat')) { renderMessages(); setBusy(); announce('Response finished.'); }
    }
  }
  function mountChat(main, lang) {
    mounted = main;
    let chat = current();
    if (!chat) chat = conversations.find(c => c.language === languageId());
    if (chat) activeId = chat.id; else chat = newConversation();
    main.innerHTML = `<header class="page-header chat-page-header"><div><p class="eyebrow">LEARN THROUGH CONVERSATION</p><h1 id="page-title" tabindex="-1">${esc(lang.name)} companion</h1></div><button type="button" class="button secondary" id="chat-settings">AI settings</button></header><div class="chat-layout"><aside class="chat-sidebar" aria-label="Session conversations"><button class="button" type="button" id="chat-new">+ New chat</button><label class="sr-only" for="chat-search">Search session conversations</label><input type="search" id="chat-search" placeholder="Search conversations" value="${esc(historyQuery)}"><div id="chat-history"></div><p class="ai-fineprint">This page session only.<br>Export a chat before leaving.</p></aside><section class="chat-panel" aria-label="Chat"><div class="chat-toolbar"><strong id="chat-title">${esc(chat.title)}</strong><div><button type="button" id="chat-rename">Rename</button><button type="button" id="chat-export">Export</button><button type="button" id="chat-delete">Delete</button></div></div><form id="chat-rename-form" class="chat-rename" hidden><label for="chat-name">Conversation name</label><input id="chat-name" maxlength="80" required><button class="button secondary" type="submit">Save name</button><button type="button" id="chat-rename-cancel">Cancel</button></form><div class="chat-context"><span>${esc(api.providers[settings.provider].name)} / ${esc(settings.models[settings.provider])}</span><label for="chat-mode">Practice mode</label><select id="chat-mode"><option value="tutor">Tutor</option><option value="conversation">Conversation</option><option value="translator">Translation</option><option value="quiz">Quiz</option></select></div><div id="chat-messages" class="chat-messages" role="region" aria-label="Conversation messages" tabindex="0"></div><div class="chat-response-tools"><span id="chat-state" role="status">Ready</span><button type="button" id="chat-regenerate">Retry / regenerate last reply</button><button type="button" id="chat-jump">↓ Latest</button></div><p id="chat-error" class="chat-error" role="status"></p><form id="chat-form" class="chat-composer"><label class="sr-only" for="chat-input">Message your ${esc(lang.name)} companion</label><textarea id="chat-input" rows="3" maxlength="12000" placeholder="Ask a question, try a sentence, or practice a conversation…"></textarea><div class="composer-actions"><span class="ai-fineprint">Enter to send · Shift+Enter for a new line</span><div><input type="file" id="chat-file" accept=".txt,.md,.csv" hidden><button type="button" id="chat-attach" class="button secondary">Attach text</button><button type="button" id="chat-cancel-edit" hidden>Cancel edit</button><button type="button" id="chat-stop" class="button secondary" hidden>Stop</button><button type="submit" id="chat-send" class="button">Send ↗</button></div></div></form><p class="chat-disclosure">AI can make mistakes. Check the language references. Your conversation and reference context go to ${esc(api.providers[settings.provider].name)} when you send. API usage may cost money. No web browsing or tool access.</p></section></div>`;
    $('chat-input').value = chat.draft;
    $('chat-mode').value = chat.mode;
    if (chat.editIndex !== undefined) $('chat-cancel-edit').hidden = false;
    $('chat-settings').addEventListener('click', openSettings);
    const historyToggle = document.createElement('button');
    historyToggle.type = 'button'; historyToggle.className = 'chat-history-toggle button secondary';
    historyToggle.textContent = 'Session chats'; historyToggle.setAttribute('aria-expanded', 'false');
    historyToggle.setAttribute('aria-controls', 'chat-history');
    $('chat-new').after(historyToggle);
    historyToggle.addEventListener('click', () => {
      const open = historyToggle.getAttribute('aria-expanded') !== 'true';
      historyToggle.setAttribute('aria-expanded', String(open));
      historyToggle.parentElement.classList.toggle('history-open', open);
    });
    $('chat-new').addEventListener('click', () => { newConversation(); mountChat(main, lang); $('chat-input').focus(); });
    $('chat-search').addEventListener('input', event => { historyQuery = event.target.value; renderHistory(); });
    $('chat-mode').addEventListener('change', event => { chat.mode = event.target.value; });
    $('chat-input').addEventListener('input', event => { chat.draft = event.target.value; });
    $('chat-input').addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); if (!chatJob) $('chat-form').requestSubmit(); }
    });
    $('chat-form').addEventListener('submit', event => {
      event.preventDefault(); if (chatJob) return;
      const text = scrub($('chat-input').value.trim()); if (!text) return;
      if (!keys[settings.provider]) { openSettings(); return; }
      if (chat.editIndex !== undefined) { chat.messages.splice(chat.editIndex); delete chat.editIndex; }
      if (!chat.messages.length) chat.title = text.slice(0, 45);
      chat.messages.push({role: 'user', content: text}); chat.draft = '';
      $('chat-input').value = ''; $('chat-cancel-edit').hidden = true; $('chat-error').textContent = '';
      $('chat-title').textContent = chat.title; renderHistory(); generate(chat);
    });
    $('chat-cancel-edit').addEventListener('click', () => { delete chat.editIndex; chat.draft = ''; $('chat-input').value = ''; $('chat-cancel-edit').hidden = true; $('chat-error').textContent = ''; });
    $('chat-attach').addEventListener('click', () => $('chat-file').click());
    $('chat-file').addEventListener('change', async event => {
      const file = event.target.files[0]; if (!file) return;
      if (!/\.(txt|md|csv)$/i.test(file.name) || file.size > 12000) { $('chat-error').textContent = 'Choose a text, Markdown, or CSV file under 12 KB.'; event.target.value = ''; return; }
      const input = $('chat-input');
      try {
        const text = scrub(await file.text());
        if (!isChatVisible(chat)) return;
        const attachment = '\n\nAttached text (' + file.name + '):\n' + text;
        if (input.value.length + attachment.length > 12000) throw new Error('Message plus attachment must fit within 12,000 characters.');
        input.value += attachment; chat.draft = input.value;
        $('chat-error').textContent = 'Text inserted into your draft. Review it before sending to the provider.';
        input.focus();
      } catch (error) { if (isChatVisible(chat)) $('chat-error').textContent = error.message; }
      event.target.value = '';
    });
    $('chat-stop').addEventListener('click', stopChat);
    $('chat-regenerate').addEventListener('click', () => {
      if (chatJob || !keys[settings.provider]) { if (!keys[settings.provider]) openSettings(); return; }
      if (chat.messages.at(-1)?.role === 'assistant') chat.messages.pop();
      $('chat-error').textContent = ''; generate(chat);
    });
    $('chat-jump').addEventListener('click', () => { $('chat-messages').scrollTop = $('chat-messages').scrollHeight; });
    $('chat-rename').addEventListener('click', () => { $('chat-rename-form').hidden = false; $('chat-name').value = chat.title; $('chat-name').focus(); });
    $('chat-rename-cancel').addEventListener('click', () => { $('chat-rename-form').hidden = true; $('chat-rename').focus(); });
    $('chat-rename-form').addEventListener('submit', event => { event.preventDefault(); chat.title = scrub($('chat-name').value.trim()) || 'Conversation'; $('chat-title').textContent = chat.title; $('chat-rename-form').hidden = true; renderHistory(); });
    $('chat-delete').addEventListener('click', () => { stopChat(); conversations = conversations.filter(c => c !== chat); activeId = null; mountChat(main, lang); });
    $('chat-export').addEventListener('click', () => download(scrub(`# ${chat.title}\n\n${lang.name} learning conversation · AI-generated content\n\n${chat.messages.map(m => `## ${m.role === 'user' ? 'You' : 'Companion'}\n\n${m.content}${m.notice ? `\n\n(${m.notice})` : ''}`).join('\n\n')}`), `${chat.language}-conversation.md`));
    renderHistory(); renderMessages(); setBusy();
  }
  function mountSpeech(main, lang) {
    stopStudio();
    mounted = null;
    main.innerHTML = `<header class="page-header"><p class="eyebrow">GIVE THE WORDS A VOICE</p><h1 id="page-title" tabindex="-1">Read ${esc(lang.name)} aloud</h1><p>Listen to a word, sentence, or passage. OpenAI and Gemini receive the pronunciation guide with each speech request. Generated pronunciation is approximate.</p></header><section class="speech-studio"><div class="speech-studio-heading"><h2>A little listening practice</h2><button type="button" class="button secondary" id="studio-settings">Voice & API settings</button></div><details class="studio-ai"><summary id="studio-ai-title">Create a passage with OpenAI</summary><p id="studio-connection" class="ai-fineprint">OpenAI / ${esc(settings.models.openai)}. Uses your OpenAI key independently of chat and speech provider choices.</p><div class="field"><label for="studio-topic">Topic or idea (optional)</label><input id="studio-topic" maxlength="500" placeholder="For example: a day with friends"></div><div class="actions"><button type="button" class="button secondary" id="studio-paragraph">Generate paragraph</button><button type="button" class="button secondary" id="studio-essay">Generate short essay</button></div><p class="ai-fineprint">Generation replaces the text below after it succeeds and includes a toggleable English translation. AI may make mistakes; vocabulary is limited to the language reference. Requests send your topic or text and the selected language's references to OpenAI and may incur charges.</p></details><div class="studio-taskbar"><p id="studio-ai-status" role="status"></p><button type="button" class="button secondary" id="studio-ai-stop" hidden>Stop</button></div><form id="speech-form"><div class="field"><label for="speech-text">Text to read (up to 3,000 characters)</label><textarea id="speech-text" rows="7" maxlength="3000"></textarea></div><div class="speech-example-translation"><button type="button" class="button secondary" id="studio-translation-toggle" aria-expanded="false" aria-controls="studio-translation">Show English translation</button><p id="studio-translation" lang="en" hidden></p><p id="studio-ai-notes" class="ai-fineprint"></p></div><div class="actions"><button class="button" type="submit">Read aloud</button><button class="button secondary" type="button" id="studio-example">Use example sentence</button></div></form><details class="english-translation"><summary>Translate English to ${esc(lang.name)}</summary><div class="field"><label for="studio-english">English text (up to 3,000 characters)</label><textarea id="studio-english" rows="4" maxlength="3000" placeholder="Write or paste English here"></textarea></div><button type="button" class="button secondary" id="studio-from-english">Translate to ${esc(lang.name)}</button><p class="ai-fineprint">Uses your OpenAI key. A successful translation replaces the read-aloud text above. Review the English meaning and any AI notes for simplifications.</p></details><p class="ai-fineprint">Synthetic speech, never a native-speaker recording. Compare with the <a href="#${languageId()}/pronunciation">pronunciation guide</a>. You can also listen from the dictionary, flashcards, chat messages, or selected text on any page.</p></section>`;
    $('speech-text').value = lang.example;
    const translationToggle = $('studio-translation-toggle');
    const translation = $('studio-translation');
    translation.textContent = lang.translation;
    let translationSource = lang.example;
    function hideTranslation() {
      translation.hidden = true;
      translationToggle.setAttribute('aria-expanded', 'false');
      translationToggle.textContent = 'Translate to English';
    }
    const textInput = $('speech-text');
    const taskStatus = $('studio-ai-status');
    const notes = $('studio-ai-notes');
    function taskBusy(busy) {
      for (const id of ['studio-paragraph', 'studio-essay', 'studio-translation-toggle', 'studio-from-english']) $(id).disabled = busy;
      $('studio-ai-stop').hidden = !busy;
      textInput.setAttribute('aria-busy', String(busy));
    }
    async function runTask(kind) {
      if (studioJob) return;
      if (['translate', 'fromEnglish'].includes(kind) && !(kind === 'fromEnglish' ? $('studio-english').value : textInput.value).trim()) { taskStatus.textContent = 'Enter text in the appropriate field before translating.'; return; }
      if (!keys.openai) { taskStatus.textContent = 'Add your OpenAI key in AI settings, then try again.'; openSettings('openai'); return; }
      stopSpeech();
      const source = scrub(kind === 'fromEnglish' ? $('studio-english').value : textInput.value);
      const controller = new AbortController();
      const job = {controller, cancelUI() {
        if (document.contains(textInput)) { taskBusy(false); taskStatus.textContent = 'Request cancelled. Existing text and translation have been kept.'; }
      }};
      studioJob = job;
      taskBusy(true);
      taskStatus.textContent = kind === 'translate' ? `Translating ${lang.name} to English...` : kind === 'fromEnglish' ? `Translating English to ${lang.name}...` : `Generating a ${kind === 'essay' ? 'short essay' : 'paragraph'} in ${lang.name}...`;
      let timedOut = false;
      const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 180000);
      try {
        const result = await api.studioTask({kind, lang, key: keys.openai, model: settings.models.openai, topic: scrub($('studio-topic').value), text: source, signal: controller.signal});
        if (studioJob !== job || controller.signal.aborted || !document.contains(textInput)) return;
        if (kind !== 'translate') stopSpeech();
        textInput.value = scrub(result.text);
        translation.textContent = scrub(result.translation);
        translationSource = textInput.value;
        notes.textContent = result.notes ? `AI notes: ${scrub(result.notes)}` : '';
        translationToggle.hidden = false;
        hideTranslation();
        if (kind === 'translate' || kind === 'fromEnglish') { translation.hidden = false; translationToggle.textContent = 'Hide English translation'; translationToggle.setAttribute('aria-expanded', 'true'); }
        taskStatus.textContent = kind === 'translate' ? 'English translation ready.' : kind === 'fromEnglish' ? `${lang.name} translation ready. Review the English meaning below.` : `${kind === 'essay' ? 'Short essay' : 'Paragraph'} ready in ${lang.name}. English translation is hidden.`;
        announce(taskStatus.textContent);
      } catch (error) {
        if (studioJob === job && document.contains(textInput)) taskStatus.textContent = error.name === 'AbortError' ? (timedOut ? 'Request timed out. Existing text has been kept; try again.' : 'Request cancelled. Existing text has been kept.') : error.message;
      } finally {
        clearTimeout(timeout);
        if (studioJob === job) { studioJob = null; if (document.contains(textInput)) taskBusy(false); }
      }
    }
    $('studio-paragraph').addEventListener('click', () => runTask('paragraph'));
    $('studio-essay').addEventListener('click', () => runTask('essay'));
    $('studio-from-english').addEventListener('click', () => runTask('fromEnglish'));
    $('studio-english').addEventListener('input', stopStudio);
    $('studio-ai-stop').addEventListener('click', stopStudio);
    $('studio-topic').addEventListener('input', stopStudio);
    translationToggle.addEventListener('click', () => {
      if (!translation.textContent || translationSource !== textInput.value) { runTask('translate'); return; }
      translation.hidden = !translation.hidden;
      translationToggle.setAttribute('aria-expanded', String(!translation.hidden));
      translationToggle.textContent = translation.hidden ? 'Translate to English' : 'Hide English translation';
    });
    $('speech-text').addEventListener('input', () => {
      stopStudio(); stopSpeech(); notes.textContent = ''; taskStatus.textContent = '';
      hideTranslation(); translation.textContent = ''; translationSource = null; translationToggle.hidden = false;
    });
    $('studio-settings').addEventListener('click', openSettings);
    $('studio-example').addEventListener('click', () => {
      stopStudio(); stopSpeech(); notes.textContent = ''; taskStatus.textContent = '';
      const example = api.exampleSentence(lang, $('speech-text').value);
      $('speech-text').value = example.sentence;
      translation.textContent = example.translation;
      translationSource = example.sentence;
      translationToggle.hidden = false; hideTranslation();
      announce(`New ${lang.name} example sentence ready. English translation is hidden.`);
    });
    hideTranslation();
    $('speech-form').addEventListener('submit', event => { event.preventDefault(); speak($('speech-text').value, lang); });
  }
  global.addEventListener('hashchange', () => {
    stopChat(); stopStudio();
    if (audioLanguage && audioLanguage !== language().name) stopSpeech();
    $('ai-chat-link').href = `#${languageId()}/chat`;
  });
  global.addEventListener('pagehide', () => {
    forgetAll(); settings.instructions = ''; mounted = null;
    if ($('ai-settings').open) $('ai-settings').close();
  });
  $('ai-chat-link').href = `#${languageId()}/chat`;
  global.LanguageAI = Object.freeze({mountChat, mountSpeech});
})(typeof window !== 'undefined' ? window : globalThis);
