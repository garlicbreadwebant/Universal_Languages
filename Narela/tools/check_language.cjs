/* Validate Narela and regenerate dictionaries using Node's standard library. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const write = process.argv.includes('--write');
const errors = [];
const source = fs.readFileSync(path.join(root, 'lexicon.csv'), 'utf8').trim().split(/\r?\n/);
if (source.shift() !== 'english,narela,category,notes') throw Error('Unexpected CSV columns');
// This source deliberately disallows commas and quotes within fields.
const rows = source.map((line, i) => {
  const values = line.split(',');
  if (values.length !== 4 || values.some(v => !v.trim() || v.includes('"'))) {
    throw Error(`Invalid simple CSV row ${i + 2}`);
  }
  return Object.fromEntries(['english', 'narela', 'category', 'notes'].map((k, j) => [k, values[j]]));
});
const words = new Set();
const english = new Set();
for (const row of rows) {
  if (words.has(row.narela)) errors.push(`Duplicate Narela word: ${row.narela}`);
  if (english.has(row.english)) errors.push(`Duplicate English headword: ${row.english}`);
  words.add(row.narela); english.add(row.english);
  if (!/^[abdefghiklmnoprstuvwxyz]+$/.test(row.narela)) errors.push(`Invalid native spelling: ${row.narela}`);
}
function render(reverse) {
  const title = reverse ? 'Narela to English Dictionary' : 'English to Narela Dictionary';
  const lines = [`# ${title}`, '', 'Narela 0.1 — October 17, 2026', '',
    'Generated from [lexicon.csv](lexicon.csv). Edit that source and run the checker with `--write`.', '',
    'Meanings are limited by the notes. See [grammar](GRAMMAR.md) and [sentence examples](LESSONS.md).', '',
    reverse ? '| Narela | English | Category | Notes |' : '| English | Narela | Category | Notes |',
    '|---|---|---|---|'];
  const key = reverse ? 'narela' : 'english';
  for (const row of [...rows].sort((a, b) => a[key].localeCompare(b[key], 'en'))) {
    const fields = reverse ? [row.narela, row.english] : [row.english, row.narela];
    lines.push('| ' + [...fields, row.category, row.notes].map(s => s.replaceAll('|', '\\|')).join(' | ') + ' |');
  }
  return lines.join('\n') + '\n';
}
const outputs = new Map([
  [path.join(root, 'English to Narela Dictionary.md'), render(false)],
  [path.join(root, 'Narela to English Dictionary.md'), render(true)]
]);
function known(word) {
  if (words.has(word)) return true;
  if (word.endsWith('n') && words.has(word.slice(0, -1))) return true;
  return ['ri', 'la'].some(suffix => word.endsWith(suffix) && words.has(word.slice(0, -suffix.length)));
}
const snippets = [];
for (const name of ['GRAMMAR.md', 'README.md', 'LESSONS.md']) {
  const content = fs.readFileSync(path.join(root, name), 'utf8');
  for (const match of content.matchAll(/`([^`\n]+)`/g)) snippets.push(match[1]);
  if (name === 'LESSONS.md') {
    for (const line of content.split('\n').filter(l => l.startsWith('| '))) {
      const cells = line.slice(1, -1).split('|').map(c => c.trim());
      if (cells.length === 2 && cells[0] !== 'Narela') snippets.push(cells[0]);
      if (cells.length === 3 && ['A', 'B'].includes(cells[0])) snippets.push(cells[1]);
    }
  }
}
for (const snippet of snippets) {
  if (/\.cjs|\.csv|\.md|--|\(C\)V/.test(snippet)) continue;
  for (const word of snippet.toLowerCase().match(/[a-z]+/g) || []) {
    if (!known(word) && !['narela', 'ana'].includes(word)) errors.push(`Unknown example word '${word}' in '${snippet}'`);
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
  console.log(`OK: ${rows.length} unique entries; native spellings, example words, links, and dictionaries checked.`);
}
