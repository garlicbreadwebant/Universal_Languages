// Offline provider contract checks. All credentials and responses are synthetic.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const api = require('./ai-client.js');
const sandbox = {window: {}};
vm.runInNewContext(fs.readFileSync(require.resolve('./data.js'), 'utf8'), sandbox);
const data = sandbox.window.LANGUAGE_DATA;
const key = 'test-key-never-real';
const events = values => new ReadableStream({start(controller) {
  const encoded = new TextEncoder().encode(values.map(value => `data: ${JSON.stringify(value)}\r\n\r\n`).join(''));
  // Split both UTF-8 codepoints and frame delimiters across arbitrary chunks.
  for (let i = 0; i < encoded.length; i += 3) controller.enqueue(encoded.slice(i, i + 3));
  controller.close();
}});
async function run() {
  for (const [provider, model] of Object.entries(api.providers).map(([id, value]) => [id, value.model])) {
    let calls = 0, text = '';
    const values = provider === 'openai' ? [{type: 'response.output_text.delta', delta: 'salí'}, {type: 'response.completed'}] : provider === 'claude' ? [{type: 'content_block_delta', delta: {type: 'text_delta', text: 'salí'}}, {type: 'message_stop'}] : [{candidates: [{content: {parts: [{text: 'salí'}]}}]}, {candidates: [{finishReason: 'STOP'}]}];
    const controller = new AbortController();
    await api.chat({provider, model, key, system: 'reference', messages: [{role: 'user', content: 'hello'}], signal: controller.signal, onDelta: delta => { text += delta; }, fetcher: async (url, options) => {
      calls++; assert(!url.includes(key)); assert(!options.body.includes(key));
      assert.equal(options.signal, controller.signal); assert.equal(options.credentials, 'omit');
      assert.equal(options.cache, 'no-store'); assert.equal(options.redirect, 'error'); assert.equal(options.referrerPolicy, 'no-referrer');
      assert(Object.values(options.headers).some(value => value.includes(key)));
      const body = JSON.parse(options.body);
      if (provider === 'openai') { assert.equal(body.store, false); assert.equal(body.instructions, 'reference'); }
      if (provider === 'claude') { assert.equal(options.headers['anthropic-dangerous-direct-browser-access'], 'true'); assert.equal(body.max_tokens, 2048); }
      if (provider === 'gemini') { assert.equal(body.contents[0].role, 'user'); assert.equal(body.system_instruction.parts[0].text, 'reference'); }
      return {ok: true, body: events(values)};
    }});
    assert.equal(calls, 1); assert.equal(text, 'salí');
  }
  assert.throws(() => api.modelId('https://evil.invalid/steal'), /model ID/);
  assert.throws(() => api.headers('openai', 'x\ny'), /valid API key/);
  const gemini = api.chatRequest('gemini', 'gemini-test', 'context', [{role: 'assistant', content: 'hi'}]);
  assert.equal(gemini.body.contents[0].role, 'model');
  for (const status of [400, 401, 403, 404, 429, 500]) {
    await assert.rejects(api.post('openai', key, {url: 'https://api.openai.com/v1/responses', body: {}}, undefined, async () => ({ok: false, status, text: () => key})), error => !error.message.includes(key));
  }
  await assert.rejects(api.post('openai', key, {url: '', body: {}}, undefined, async () => { throw new Error(key); }), error => !error.message.includes(key));
  const aborted = new DOMException('Cancelled', 'AbortError');
  await assert.rejects(api.post('openai', key, {url: '', body: {}}, undefined, async () => { throw aborted; }), error => error === aborted);
  await assert.rejects(api.readSSE(events([{error: {message: key}}]), () => {}), error => !error.message.includes(key));
  await assert.rejects(api.readSSE(events([{type: 'response.output_text.delta', delta: 'partial'}]), () => {}), /before the response finished/);
  const incomplete = await api.chat({provider: 'openai', model: 'test', key, system: '', messages: [], onDelta() {}, fetcher: async () => ({ok: true, body: events([{type: 'response.incomplete'}])})});
  assert.match(incomplete, /output limit/);
  assert.equal(api.textDelta('gemini', {candidates: [{content: {parts: [{thought: true, text: 'hidden'}, {text: 'visible'}]}}]}), 'visible');
  for (const lang of Object.values(data)) {
    const examples = new Set();
    for (let i = 0; i < 48; i++) {
      const example = api.exampleSentence(lang, '', () => i / 48);
      assert(example.translation.endsWith('.')); assert(example.sentence.endsWith('.'));
      for (const token of example.sentence.slice(0, -1).split(' ')) {
        const base = lang.name === 'Esperanto' ? token.replace(/(as|is|os)$/, 'i').replace(/n$/, '') : token;
        assert(base === lang.name || lang.entries.some(entry => entry.word.toLowerCase() === base.toLowerCase()), `${lang.name} example uses known word: ${token}`);
      }
      examples.add(example.sentence);
      assert.notEqual(api.exampleSentence(lang, example.sentence, () => i / 48).sentence, example.sentence);
    }
    assert.equal(examples.size, 48);
    assert.deepEqual(api.exampleSentence(lang, '', () => 0), {sentence: lang.name === 'Lumena' ? 'mi leta puka.' : lang.name === 'Taluma' ? 'mi leka lipo.' : lang.name === 'Esperanto' ? 'Mi legas libron.' : 'Mi reda buki.', translation: 'I read a book.'});
    assert.equal(api.exampleSentence(lang, '', () => 1 / 48).sentence, lang.name === 'Lumena' ? 'mi pa leta puka.' : lang.name === 'Taluma' ? 'mi pa leka lipo.' : lang.name === 'Esperanto' ? 'Mi legis libron.' : 'Mi pa reda buki.');
    assert.equal(api.exampleSentence(lang, '', () => 2 / 48).sentence, lang.name === 'Lumena' ? 'mi pu leta puka.' : lang.name === 'Taluma' ? 'mi pu leka lipo.' : lang.name === 'Esperanto' ? 'Mi legos libron.' : 'Mi fu reda buki.');
    const context = api.languageContext(lang, 'quiz');
    for (const entry of lang.entries) assert(context.includes(`${entry.word} | ${entry.english} |`), `${lang.name} training reference includes ${entry.english}`);
    assert(context.includes(lang.documents.grammar)); assert(context.includes(lang.entries.at(-1).word));
    assert(context.includes('Wait for an answer'));
    for (const provider of ['openai', 'gemini']) {
      const request = api.speechRequest(provider, lang.greeting, lang, api.providers[provider].voices[0], api.providers[provider].speechModel);
      assert(JSON.stringify(request.body).includes(lang.documents.pronunciation.split('\n')[0]));
      if (provider === 'gemini') {
        assert.equal(request.body.contents[0].parts[0].text, lang.greeting);
        assert(request.body.contents[0].parts[0].speech_metadata.style.includes(lang.name));
      }
    }
  }
  assert.throws(() => api.speechRequest('claude', 'hello', data.lumena), /no speech adapter/);
  for (const lang of Object.values(data)) {
    for (const kind of ['paragraph', 'essay', 'translate', 'fromEnglish']) {
      const input = lang.example;
      const output = {translation: 'I learn.\n\nWe read.', notes: 'Limited vocabulary.'};
      if (kind !== 'translate') output.text = `${lang.greeting}.\n\n${lang.example}`;
      const controller = new AbortController();
      const result = await api.studioTask({kind, lang, key, model: 'gpt-4.1-mini', topic: 'Friendship', text: input, signal: controller.signal, fetcher: async (url, options) => {
        assert.equal(url, 'https://api.openai.com/v1/responses');
        assert.equal(options.headers.Authorization, `Bearer ${key}`); assert.equal(options.signal, controller.signal);
        const body = JSON.parse(options.body);
        assert.equal(body.store, false); assert.equal(body.text.format.type, 'json_schema');
        assert.equal(body.text.format.strict, true); assert.equal(body.text.format.schema.additionalProperties, false);
        assert(body.instructions.includes(lang.documents.grammar)); assert(body.instructions.includes(lang.entries.at(-1).word));
        assert(!options.body.includes(key));
        if (kind === 'fromEnglish') {
          assert.equal(JSON.parse(body.input[0].content).sourceLanguage, 'English');
          assert.equal(JSON.parse(body.input[0].content).targetLanguage, lang.name);
          assert.equal(JSON.parse(body.input[0].content).text, input);
        } else if (kind === 'translate') assert.equal(JSON.parse(body.input[0].content).text, input);
        else assert.equal(JSON.parse(body.input[0].content).form, kind);
        const raw = JSON.stringify(output);
        return {ok: true, body: events([{type: 'response.output_text.delta', delta: raw.slice(0, 12)}, {type: 'response.output_text.delta', delta: raw.slice(12)}, {type: 'response.completed'}])};
      }});
      assert.equal(result.text, kind === 'translate' ? input : output.text);
      assert.equal(result.translation, output.translation); assert.equal(result.notes, output.notes);
    }
  }
  const studio = {kind: 'paragraph', lang: data.lumena, key, model: 'gpt-4.1-mini'};
  for (const output of ['not JSON', JSON.stringify({text: 'x'.repeat(3001), translation: 'Hello.', notes: ''}), JSON.stringify({text: 'sali', translation: '', notes: ''})]) {
    await assert.rejects(api.studioTask({...studio, fetcher: async () => ({ok: true, body: events([{type: 'response.output_text.delta', delta: output}, {type: 'response.completed'}])})}), /invalid|complete/);
  }
  await assert.rejects(api.studioTask({...studio, kind: 'translate', text: ''}), /characters to translate/);
  await assert.rejects(api.studioTask({...studio, fetcher: async () => ({ok: true, body: events([{type: 'response.incomplete'}])})}), /incomplete/);
  assert.throws(() => api.speechRequest('openai', 'x'.repeat(3001), data.lumena), /3,000/);
  const pcm = new Uint8Array([0, 0, 1, 0]);
  const wav = api.pcmWav(pcm);
  assert.equal(new TextDecoder().decode(wav.slice(0, 4)), 'RIFF');
  assert.equal(new DataView(wav.buffer).getUint32(24, true), 24000);
  assert.equal(wav.length, 48); assert.deepEqual(wav.slice(44), pcm);
  const speechOptions = {provider: 'gemini', key, text: 'sali', lang: data.narela, voice: 'Kore', model: 'gemini-3.8-flash-tts'};
  for (const mimeType of ['audio/L16;codec=pcm;rate=24000', 'audio/wav']) {
    const blob = await api.speech({...speechOptions, fetcher: async () => ({ok: true, json: async () => ({candidates: [{content: {parts: [{inlineData: {mimeType, data: Buffer.from(pcm).toString('base64')}}]}}]})})});
    assert.equal(blob.type, 'audio/wav'); assert.equal(blob.size, mimeType === 'audio/wav' ? 4 : 48);
  }
  await assert.rejects(api.speech({...speechOptions, fetcher: async () => ({ok: true, json: async () => ({candidates: []})})}), /no audio/);
  await assert.rejects(api.speech({...speechOptions, fetcher: async () => ({ok: true, json: async () => { throw new SyntaxError(key); }})}), error => !error.message.includes(key));
  const ui = fs.readFileSync(require.resolve('./ai-ui.js'), 'utf8');
  assert(!/localStorage|sessionStorage|indexedDB|document\.cookie|console\./.test(ui));
  assert(ui.includes("addEventListener('pagehide'"));
  console.log('OK: all three chat contracts, credential headers, safe failures, streaming boundaries, cancellation, language context, speech payloads, WAV conversion, and memory-only UI.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
