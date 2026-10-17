// Optional real-browser UI regression checks. No packages, network API calls or real keys.
// Windows: node website/check-browser.cjs (Chrome); override its path with CHROME_PATH.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const {spawn} = require('node:child_process');
const {once} = require('node:events');
const root = path.resolve(__dirname, '..', '.site-build');
const types = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml'};
const server = http.createServer((request, response) => {
  let file;
  try { file = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname).replace(/\/$/, '/index.html')); } catch { response.writeHead(400).end(); return; }
  if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  fs.readFile(file, (error, bytes) => { if (error) response.writeHead(404).end(); else { response.writeHead(200, {'Content-Type': types[path.extname(file)] || 'text/plain'}); response.end(bytes); } });
});
let chrome, socket;
async function run() {
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const port = server.address().port;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'language-ui-test-'));
  chrome = spawn(process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank'], {windowsHide: true, stdio: ['ignore', 'ignore', 'pipe']});
  const endpoint = await new Promise((resolve, reject) => {
    let stderr = '';
    const timer = setTimeout(() => reject(new Error('Chrome debugging startup timed out')), 20000);
    chrome.on('error', error => { clearTimeout(timer); reject(error); });
    chrome.stderr.on('data', bytes => { stderr += bytes; const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/); if (match) { clearTimeout(timer); resolve(match[1]); } });
    chrome.on('exit', code => { clearTimeout(timer); reject(new Error(`Chrome exited (${code})`)); });
  });
  socket = new WebSocket(endpoint); await once(socket, 'open');
  let serial = 0; const pending = new Map(), exceptions = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) { const {resolve, reject, timer} = pending.get(message.id); clearTimeout(timer); pending.delete(message.id); message.error ? reject(new Error(message.error.message)) : resolve(message.result); }
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text + ': ' + (message.params.exceptionDetails.exception?.description || ''));
  });
  const cdp = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++serial, timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
    pending.set(id, {resolve, reject, timer}); socket.send(JSON.stringify({id, method, params, ...(sessionId ? {sessionId} : {})}));
  });
  const {targetId} = await cdp('Target.createTarget', {url: 'about:blank'});
  const {sessionId} = await cdp('Target.attachToTarget', {targetId, flatten: true});
  const command = (method, params) => cdp(method, params, sessionId);
  await command('Runtime.enable'); await command('Page.enable');
  const evaluate = async expression => {
    const result = await command('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const until = async expression => {
    const start = Date.now();
    while (!(await evaluate(expression))) { if (Date.now() - start > 8000) throw new Error(`UI wait failed: ${expression}`); await new Promise(resolve => setTimeout(resolve, 50)); }
  };
  const navigate = async route => { await evaluate(`location.hash = ${JSON.stringify(route)}`); await until(`document.querySelector('#page-title')?.textContent.includes(${JSON.stringify(route.endsWith('chat') ? 'companion' : route.endsWith('speech') ? 'aloud' : route.endsWith('flashcards') ? 'flashcards' : 'dictionary')})`); };
  const click = id => evaluate(`document.getElementById(${JSON.stringify(id)}).click()`);
  const value = (id, text) => evaluate(`document.getElementById(${JSON.stringify(id)}).value = ${JSON.stringify(text)}; document.getElementById(${JSON.stringify(id)}).dispatchEvent(new Event('input', {bubbles:true}))`);
  const change = (id, text) => evaluate(`document.getElementById(${JSON.stringify(id)}).value = ${JSON.stringify(text)}; document.getElementById(${JSON.stringify(id)}).dispatchEvent(new Event('change', {bubbles:true}))`);
  await command('Emulation.setDeviceMetricsOverride', {width: 1440, height: 1050, deviceScaleFactor: 1, mobile: false});
  await command('Page.navigate', {url: `http://127.0.0.1:${port}/index.html#lumena/chat`});
  await until("!!document.getElementById('chat-input')");
  await evaluate(`window.mockCalls = []; window.mockMode = 'ok';
    HTMLMediaElement.prototype.play = async function () {};
    window.fetch = async (url, options) => {
      mockCalls.push({url, body: JSON.parse(options.body), headers: options.headers});
      if (mockMode === '401') return new Response('never display test-key-openai', {status:401});
      if (url.includes('/audio/speech')) return new Response(new Uint8Array(48), {headers:{'Content-Type':'audio/mpeg'}});
      const provider = url.includes('anthropic') ? 'claude' : url.includes('googleapis') ? 'gemini' : 'openai';
      const text = '**sali** — hello. <img src=x onerror="window.xss=true">';
      const delta = provider === 'openai' ? {type:'response.output_text.delta',delta:text} : provider === 'claude' ? {type:'content_block_delta',delta:{type:'text_delta',text}} : {candidates:[{content:{parts:[{text}]}}]};
      const end = provider === 'openai' ? {type:'response.completed'} : provider === 'claude' ? {type:'message_stop'} : {candidates:[{finishReason:'STOP'}]};
      return new Response(new ReadableStream({start(controller) {
        controller.enqueue(new TextEncoder().encode('data: ' + JSON.stringify(delta) + '\\n\\n'));
        if (mockMode === 'slow') options.signal.addEventListener('abort', () => controller.error(new DOMException('Cancelled','AbortError')), {once:true});
        else {controller.enqueue(new TextEncoder().encode('data: ' + JSON.stringify(end) + '\\n\\n')); controller.close();}
      }}), {headers:{'Content-Type':'text/event-stream'}});
    };`);
  async function configure(provider, speech = 'browser') {
    await click('ai-open-settings'); await change('ai-provider', provider); await value('ai-key', `test-key-${provider}`);
    await change('ai-speech-provider', speech);
    await evaluate("document.getElementById('ai-settings-form').requestSubmit()");
    await until("!document.getElementById('ai-settings').open");
  }
  async function send(text) {
    await value('chat-input', text); await evaluate("document.getElementById('chat-form').requestSubmit()");
    await until("document.querySelector('.assistant .message-content')?.textContent.includes('sali') && document.getElementById('chat-stop').hidden");
  }
  await configure('openai'); await send('Teach me a greeting');
  assert.equal(await evaluate("document.querySelector('.assistant strong').textContent"), 'sali');
  assert.equal(await evaluate("!!document.querySelector('.message-content img') || !!window.xss"), false);
  assert.equal(await evaluate("document.getElementById('ai-key').value"), '');
  assert.equal(await evaluate("localStorage.length + sessionStorage.length"), 0);
  assert.equal(await evaluate("document.body.textContent.includes('test-key-openai')"), false);
  await evaluate("document.querySelector('[data-edit]').click()"); await send('Teach me another greeting');
  assert.equal(await evaluate("document.querySelectorAll('.chat-message').length"), 2);
  await click('chat-regenerate'); await until("document.getElementById('chat-stop').hidden");
  assert.equal(await evaluate("document.querySelectorAll('.chat-message').length"), 2);
  await click('chat-new'); assert.equal(await evaluate("document.querySelectorAll('.chat-message').length"), 0);
  await value('chat-input', 'Keep this draft'); await navigate('#lumena/dictionary'); await navigate('#lumena/chat');
  assert.equal(await evaluate("document.getElementById('chat-input').value"), 'Keep this draft');
  await evaluate("document.querySelectorAll('[data-chat-id]')[1].click()");
  assert.equal(await evaluate("document.querySelectorAll('.chat-message').length"), 2);
  await configure('openai', 'openai'); await navigate('#lumena/flashcards'); await click('flashcard-listen');
  await until("!document.getElementById('speech-audio').hidden");
  assert.equal(await evaluate("mockCalls.at(-1).body.model"), 'gpt-4o-mini-tts');
  await click('speech-stop');
  await navigate('#narela/chat'); assert.equal(await evaluate("document.querySelectorAll('.chat-message').length"), 0);
  for (const provider of ['gemini', 'claude']) { await configure(provider); await send(`Hello from ${provider}`); }
  assert.equal(await evaluate("mockCalls.at(-1).body.system.includes('Narela') && mockCalls.at(-1).body.system.includes('LEXICON')"), true);
  await evaluate("mockMode = '401'"); await click('chat-regenerate');
  await until("document.querySelector('.message-notice')?.textContent.includes('rejected')");
  assert.equal(await evaluate("document.body.textContent.includes('test-key-')"), false);
  await evaluate("mockMode = 'slow'"); await click('chat-regenerate');
  await until("!document.getElementById('chat-stop').hidden"); await click('chat-stop');
  await until("document.querySelector('.message-notice')?.textContent.includes('stopped')");
  await command('Page.captureScreenshot', {format: 'png', captureBeyondViewport: false}).then(result => fs.writeFileSync(path.join(root, 'chat-desktop.png'), Buffer.from(result.data, 'base64')));
  await command('Emulation.setDeviceMetricsOverride', {width: 390, height: 844, deviceScaleFactor: 1, mobile: true});
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  await command('Page.captureScreenshot', {format: 'png', captureBeyondViewport: false}).then(result => fs.writeFileSync(path.join(root, 'chat-mobile.png'), Buffer.from(result.data, 'base64')));
  await click('ai-open-settings'); await click('ai-forget-all'); await click('ai-close-settings');
  assert.equal(await evaluate("document.querySelectorAll('.chat-message').length"), 0);
  await value('chat-input', 'No key now'); await evaluate("document.getElementById('chat-form').requestSubmit()");
  assert.equal(await evaluate("document.getElementById('ai-settings').open"), true);
  await click('ai-close-settings');
  await configure('openai'); await evaluate("dispatchEvent(new PageTransitionEvent('pagehide'))");
  await value('chat-input', 'After pagehide'); await evaluate("document.getElementById('chat-form').requestSubmit()");
  assert.equal(await evaluate("document.getElementById('ai-settings').open"), true);
  await command('Page.reload');
  await until("!!document.getElementById('chat-input') && !document.getElementById('ai-settings').open");
  await value('chat-input', 'After reload'); await evaluate("document.getElementById('chat-form').requestSubmit()");
  assert.equal(await evaluate("document.getElementById('ai-settings').open"), true);
  assert.equal(await evaluate("document.querySelectorAll('.chat-message').length"), 0);
  assert.deepEqual(exceptions, []);
  console.log('OK: real Chrome desktop/mobile, all provider flows, safe rich text, edit/regenerate, history/drafts, language isolation, flashcard speech, errors, stop, forget, pagehide cleanup, and no browser storage.');
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { socket?.close(); chrome?.kill(); server.close(); });
