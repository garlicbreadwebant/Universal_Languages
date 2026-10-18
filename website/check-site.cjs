const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const {filterEntries, parseRoute, safeLink, markdown} = require('./app.js');
const root = path.resolve(__dirname, '..');
console.log(`OK: ${require('../tools/check-vocabulary.cjs').checkVocabulary()} shared English headwords in all four languages.`);
for (const name of ['Lumena', 'Narela', 'Esperanto', 'Taluma']) {
  console.log(execFileSync(process.execPath, [path.join(root, name, 'tools/check_language.cjs')], {encoding: 'utf8'}).trim());
}
console.log(execFileSync(process.execPath, [path.join(__dirname, 'build-data.cjs'), '--check'], {encoding: 'utf8'}).trim());
const sandbox = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8'), sandbox);
const data = sandbox.window.LANGUAGE_DATA;
const versions = require('../versions.json');
for (const [id, lang] of Object.entries(data)) assert.equal(lang.version, versions.languages[id], `${id} release version matches metadata`);
const sharedEnglish = Object.values(data)[0].entries.map(entry => entry.english).sort();
for (const lang of Object.values(data)) {
  assert.deepEqual(lang.entries.map(entry => entry.english).sort(), sharedEnglish, `${lang.name} exposes every shared headword to dictionaries and flashcards`);
}
for (const [id, lang] of Object.entries(data)) {
  assert.equal(filterEntries(lang.entries, '', '').length, lang.entries.length);
  assert(filterEntries(lang.entries, 'WATER', '').some(e => e.word === (id === 'esperanto' ? 'akvo' : 'aku')));
  assert.equal(filterEntries(lang.entries, 'zzzz-no-such-word', '').length, 0);
  for (const category of new Set(lang.entries.map(e => e.category))) {
    const subset = filterEntries(lang.entries, '', category);
    assert(subset.length > 0 && subset.every(e => e.category === category));
  }
  for (const [page, doc] of Object.entries(lang.documents)) {
    const html = markdown(doc, id);
    assert(html.includes('<h1>'), `${id}/${page} has a heading`);
    const headingCount = (doc.match(/^#{1,6}\s+/gm) || []).length;
    assert.equal((html.match(/<h[1-6]>/g) || []).length, headingCount, `${id}/${page} preserves headings`);
    assert.equal((html.match(/<table>/g) || []).length, (html.match(/<\/table>/g) || []).length, `${id}/${page} closes tables`);
  }
}
assert.deepEqual(parseRoute('#narela/grammar', data), {language: 'narela', page: 'grammar'});
for (const language of Object.keys(data)) {
  assert.deepEqual(parseRoute(`#${language}/flashcards`, data), {language, page: 'flashcards'});
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, {value: '', hidden: false, dataset: {}, listeners: {}, attributes: {},
      addEventListener(type, listener) { this.listeners[type] = listener; },
      setAttribute(key, value) { this.attributes[key] = value; },
      querySelector() { return null; }});
    return elements.get(id);
  };
  element('flashcard-direction').value = 'word';
  const browser = {LANGUAGE_DATA: data, document: {getElementById: element, querySelectorAll: () => []}, addEventListener() {}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8'), {window: browser, document: browser.document, location: {hash: `#${language}/flashcards`}});
  const click = id => element(id).listeners.click();
  assert.equal(element('flashcard-prompt').textContent, data[language].entries[0].word);
  assert.equal(element('flashcard-answer').hidden, true);
  // Every source row must remain reachable, including English senses sharing a target word.
  for (const entry of data[language].entries) {
    assert.equal(element('flashcard-prompt').textContent, entry.word);
    click('flashcard-reveal');
    assert.equal(element('flashcard-translation').textContent, entry.english);
    click('flashcard-next');
  }
  assert.equal(element('flashcard-prompt').textContent, data[language].entries[0].word);
  click('flashcard-reveal');
  assert.equal(element('flashcard-answer').hidden, false);
  assert.equal(element('flashcard-translation').textContent, data[language].entries[0].english);
  click('flashcard-next');
  assert.equal(element('flashcard-answer').hidden, true);
  assert.equal(element('flashcard-prompt').textContent, data[language].entries[1].word);
  click('flashcard-previous');
  click('flashcard-previous');
  assert.equal(element('flashcard-prompt').textContent, data[language].entries.at(-1).word);
  const category = data[language].entries[0].category;
  element('flashcard-category').value = category;
  element('flashcard-category').listeners.change();
  const subset = data[language].entries.filter(entry => entry.category === category);
  assert.equal(element('flashcard-progress').textContent, `Card 1 of ${subset.length}`);
  element('flashcard-direction').value = 'english';
  element('flashcard-direction').listeners.change();
  assert.equal(element('flashcard-prompt').textContent, subset[0].english);
  click('flashcard-shuffle');
  assert(subset.some(entry => entry.english === element('flashcard-prompt').textContent));
  assert.equal(element('flashcard-answer').hidden, true);
}
assert.deepEqual(parseRoute('#__proto__/constructor', data), {language: 'lumena', page: 'overview'});
assert.equal(safeLink('javascript:alert(1)', 'lumena'), null);
assert.equal(safeLink('//example.com', 'lumena'), null);
assert.equal(safeLink('../Narela/GRAMMAR.md', 'lumena'), '#narela/grammar');
assert.equal(safeLink('../Esperanto/GRAMMAR.md', 'lumena'), '#esperanto/grammar');
assert.equal(safeLink('../Taluma/GRAMMAR.md', 'lumena'), '#taluma/grammar');
assert.equal(safeLink('lexicon.csv', 'taluma'), '../Taluma/lexicon.csv');
assert.equal(safeLink('English%20to%20Taluma%20Dictionary.md', 'taluma'), '#taluma/dictionary');
assert.equal(safeLink('lexicon.csv', 'esperanto'), '../Esperanto/lexicon.csv');
assert.equal(safeLink('English%20to%20Esperanto%20Dictionary.md', 'esperanto'), '#esperanto/dictionary');
assert(filterEntries(data.esperanto.entries, 'ĝardeno', '').some(e => e.word === 'ĝardeno'));
assert(filterEntries(data.esperanto.entries, 'gardeno', '').some(e => e.word === 'ĝardeno'));
assert.equal(safeLink('English%20to%20Lumena%20Dictionary.md', 'lumena'), '#lumena/dictionary');
assert(markdown('<img src=x onerror=alert(1)>', 'lumena').includes('&lt;img'));
assert(!markdown('[bad](javascript:evil)', 'lumena').includes('<a'));
assert(markdown('~~~js\n<b>hello</b>\n~~~', 'lumena').includes('&lt;b&gt;hello&lt;/b&gt;'));
assert.equal(filterEntries(data.lumena.entries, 'WATER aku', '').length, 1);
assert.equal(filterEntries(data.lumena.entries, 'water', 'modal').length, 0);
assert(markdown('| Word | Meaning |\n|---|---|\n| aku | water |', 'lumena').includes('<td>aku</td><td>water</td>'));
assert(markdown('1. First\n2. Second', 'narela').includes('<ol><li>First</li><li>Second</li></ol>'));
const index = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
assert(index.includes(`Edition ${versions.project}`), 'Website footer matches the project release version');
for (const id of Object.keys(data)) assert(index.includes(`data-language="${id}"`), `Language switch exists: ${id}`);
const site = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'site-data.js'), 'utf8'), site);
for (const [name, source] of Object.entries(site.window.SITE_DOCUMENTS)) {
  assert.equal(source, fs.readFileSync(path.join(__dirname, `${name}.md`), 'utf8').replace(/\r\n/g, '\n'));
  assert(markdown(source, 'narela').includes('<h1>'));
}
for (const page of ['privacy', 'cookies', 'terms', 'updates']) {
  assert.deepEqual(parseRoute(`#narela/${page}`, data), {language: 'narela', page});
  assert(index.includes(`data-site-page="${page}"`));
}
assert(fs.readFileSync(path.join(root, 'LICENSE'), 'utf8').startsWith('MIT License'));
for (const match of index.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (/^(#|https?:\/\/)/.test(match[1])) continue;
  assert(fs.existsSync(path.resolve(__dirname, match[1])), `Local asset/link exists: ${match[1]}`);
}
for (const name of ['app.js', 'data.js', 'ai-client.js', 'ai-ui.js', 'build-data.cjs', 'check-site.cjs', 'check-ai.cjs']) execFileSync(process.execPath, ['--check', path.join(__dirname, name)]);
console.log(execFileSync(process.execPath, [path.join(__dirname, 'check-ai.cjs')], {encoding: 'utf8'}).trim());
console.log('OK: search, filters, routes, all reference pages, safe rendering, source freshness, local assets, and JavaScript syntax.');
