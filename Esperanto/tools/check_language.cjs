/* Validate Esperanto and regenerate dictionaries using Node's standard library. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const write = process.argv.includes('--write');
const errors = [];
const source = fs.readFileSync(path.join(root, 'lexicon.csv'), 'utf8').trim().split(/\r?\n/);
if (source.shift() !== 'english,esperanto,category,notes') throw Error('Unexpected CSV columns');
// This source deliberately disallows commas and quotes within fields.
const rows = source.map((line, i) => {
  const values = line.split(',');
  if (values.length !== 4 || values.some(v => !v.trim() || v.includes('"'))) {
    throw Error(`Invalid simple CSV row ${i + 2}`);
  }
  return Object.fromEntries(['english', 'esperanto', 'category', 'notes'].map((k, j) => [k, values[j]]));
});
const words = new Set();
const english = new Set();
for (const row of rows) {
  if (english.has(row.english)) errors.push(`Duplicate English headword: ${row.english}`);
  words.add(row.esperanto); english.add(row.english);
  // Shared English senses may translate to the same word. Validate every phrase component.
  for (const token of row.esperanto.split(/(?: \/ |[ -])/).filter(Boolean)) {
    if (token === 'Esperanto') continue; // Borrowed proper name; not a native root.
    if (!/^[abcĉdefgĝhĥijĵklmnoprsŝtuŭvz]+$/u.test(token.toLowerCase())) errors.push(`Invalid native spelling: ${token}`);
  }
}
function render(reverse) {
  const title = reverse ? 'Esperanto to English Dictionary' : 'English to Esperanto Dictionary';
  const lines = [`# ${title}`, '', `Esperanto learning collection ${require('../../versions.json').languages.esperanto} — October 18, 2026`, '',
    'Generated from [lexicon.csv](lexicon.csv). Edit that source and run the checker with `--write`.', '',
    'Meanings are limited by the notes. See [grammar](GRAMMAR.md) and [sentence examples](LESSONS.md).', '',
    reverse ? '| Esperanto | English | Category | Notes |' : '| English | Esperanto | Category | Notes |',
    '|---|---|---|---|'];
  const key = reverse ? 'esperanto' : 'english';
  for (const row of [...rows].sort((a, b) => a[key].localeCompare(b[key], 'en'))) {
    const fields = reverse ? [row.esperanto, row.english] : [row.english, row.esperanto];
    lines.push('| ' + [...fields, row.category, row.notes].map(s => s.replaceAll('|', '\\|')).join(' | ') + ' |');
  }
  return lines.join('\n') + '\n';
}
const outputs = new Map([
  [path.join(root, 'English to Esperanto Dictionary.md'), render(false)],
  [path.join(root, 'Esperanto to English Dictionary.md'), render(true)]
]);
// Recognize only forms taught in the beginner guides; this is not a full parser.
const lowerWords = new Set([...words].flatMap(word => word.toLowerCase().split(' ')));
function known(word) {
  if (lowerWords.has(word) || word === 'ana') return true;
  const nominal = word.replace(/n$/, '').replace(/j$/, '');
  if (lowerWords.has(nominal)) return true;
  if (/(as|is|os|us|u)$/.test(word) && lowerWords.has(word.replace(/(as|is|os|us|u)$/, 'i'))) return true;
  return false;
}
for (const name of ['GRAMMAR.md', 'README.md', 'LESSONS.md']) {
  const content = fs.readFileSync(path.join(root, name), 'utf8');
  const snippets = [...content.matchAll(/`([^`\n]+)`/g)].map(match => match[1]);
  if (name === 'LESSONS.md') {
    for (const line of content.split('\n').filter(line => line.startsWith('| '))) {
      const cells = line.slice(1, -1).split('|').map(cell => cell.trim());
      if (cells.length === 2 && cells[0] !== 'Esperanto') snippets.push(cells[0]);
      if (cells.length === 3 && ['A', 'B'].includes(cells[0])) snippets.push(cells[1]);
    }
  }
  for (const snippet of snippets) {
    for (const word of snippet.toLowerCase().match(/[a-zĉĝĥĵŝŭ]+/gu) || []) {
      if (!known(word)) errors.push(`Unknown example word '${word}' in '${snippet}'`);
    }
  }
}
const markdown = [path.join(root, '..', 'README.md'), ...fs.readdirSync(root).filter(f => f.endsWith('.md')).map(f => path.join(root, f))];
for (const file of markdown) {
  for (const match of fs.readFileSync(file, 'utf8').matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1];
    if (target.includes('://') || target.startsWith('#')) continue;
    const full = path.resolve(path.dirname(file), decodeURIComponent(target.split('#')[0]));
    if (!fs.existsSync(full) && !(write && outputs.has(full))) errors.push(`Broken link in ${path.basename(file)}: ${target}`);
  }
}
if (!errors.length) {
  for (const [file, content] of outputs) {
    if (write) fs.writeFileSync(file, content, 'utf8');
    else if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content) errors.push(`Outdated dictionary: ${path.basename(file)}; run with --write`);
  }
}
if (errors.length) {
  console.error([...new Set(errors)].join('\n'));
  process.exitCode = 1;
} else {
  console.log(`OK: ${rows.length} English headwords; native spellings, example words, links, and dictionaries checked.`);
}
