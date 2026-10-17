const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const {filterEntries, parseRoute, safeLink, markdown} = require('./app.js');
const root = path.resolve(__dirname, '..');
for (const name of ['Lumena', 'Narela']) {
  console.log(execFileSync(process.execPath, [path.join(root, name, 'tools/check_language.cjs')], {encoding: 'utf8'}).trim());
}
console.log(execFileSync(process.execPath, [path.join(__dirname, 'build-data.cjs'), '--check'], {encoding: 'utf8'}).trim());
const sandbox = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8'), sandbox);
const data = sandbox.window.LANGUAGE_DATA;
for (const [id, lang] of Object.entries(data)) {
  assert.equal(filterEntries(lang.entries, '', '').length, lang.entries.length);
  assert(filterEntries(lang.entries, 'WATER', '').some(e => e.word === 'aku'));
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
assert.deepEqual(parseRoute('#__proto__/constructor', data), {language: 'lumena', page: 'overview'});
assert.equal(safeLink('javascript:alert(1)', 'lumena'), null);
assert.equal(safeLink('//example.com', 'lumena'), null);
assert.equal(safeLink('../Narela/GRAMMAR.md', 'lumena'), '#narela/grammar');
assert.equal(safeLink('English%20to%20Lumena%20Dictionary.md', 'lumena'), '#lumena/dictionary');
assert(markdown('<img src=x onerror=alert(1)>', 'lumena').includes('&lt;img'));
assert(!markdown('[bad](javascript:evil)', 'lumena').includes('<a'));
assert(markdown('~~~js\n<b>hello</b>\n~~~', 'lumena').includes('&lt;b&gt;hello&lt;/b&gt;'));
assert.equal(filterEntries(data.lumena.entries, 'WATER aku', '').length, 1);
assert.equal(filterEntries(data.lumena.entries, 'water', 'modal').length, 0);
assert(markdown('| Word | Meaning |\n|---|---|\n| aku | water |', 'lumena').includes('<td>aku</td><td>water</td>'));
assert(markdown('1. First\n2. Second', 'narela').includes('<ol><li>First</li><li>Second</li></ol>'));
const index = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
for (const match of index.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (match[1].startsWith('#')) continue;
  assert(fs.existsSync(path.resolve(__dirname, match[1])), `Local asset/link exists: ${match[1]}`);
}
for (const name of ['app.js', 'data.js', 'build-data.cjs', 'check-site.cjs']) execFileSync(process.execPath, ['--check', path.join(__dirname, name)]);
console.log('OK: search, filters, routes, all reference pages, safe rendering, source freshness, local assets, and JavaScript syntax.');
