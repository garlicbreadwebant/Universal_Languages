/* Validate Taluma's lexical dependencies and selected grammatical invariants; generate dictionaries. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const native = /^(?:[klmnpstwy]?[aeiou])+$/;
const suffixes = {'ki': ['verb','noun'], 'mo': ['verb','noun'], 'po': ['verb','noun'], 'la': ['noun','description'], 'me': ['description','adverb'], 'se': ['description','noun']};
const pairs = {kepi:'nasuku', yali:'moteka', si:'nopaku', kotu:'pusano'};
const closers = new Set(Object.values(pairs));
const names = new Set(['Taluma','Esperanto','Ana']);
function loadRows() {
 const lines = fs.readFileSync(path.join(root, 'lexicon.csv'), 'utf8').trim().split(/\r?\n/);
 assert.equal(lines.shift(), 'english,taluma,category,notes');
 return lines.map((line, index) => {
  const fields = line.split(',');
  assert(fields.length === 4 && fields.every(field => field.trim() && !field.includes('"')), `Malformed CSV row ${index + 2}`);
  const [english, word, category, notes] = fields;
  return {english, word, category, notes};
 });
}
function createValidator(rows) {
 const stems = new Map();
 const typeOf = category => category.includes('verb') && !category.includes('adverb') || category === 'modal' ? 'verb' : category.includes('description') ? 'description' : category.split('/')[0];
 const add = (word, type) => { if (!stems.has(word)) stems.set(word, new Set()); stems.get(word).add(type); };
 for (const row of rows) {
  for (const word of row.word.split(' / ')) if (/^[a-z]+$/.test(word)) add(word, typeOf(row.category));
  for (const definition of row.notes.matchAll(/Stem ([a-z]+): ([^;]+)/g)) {
   assert.equal(definition[1], 'kasi', 'Review categories for any newly declared non-headword stem');
   add(definition[1], 'description');
  }
 }
 // Direct quotation words are explicitly defined in the grammar's additional-particle table.
 const grammar = fs.readFileSync(path.join(root, 'GRAMMAR.md'), 'utf8');
 const additional = grammar.split('### Additional defined particles')[1].split('## 6.')[0];
 for (const match of additional.matchAll(/^\| ([a-z]+) \| /gm)) add(match[1], 'particle');
 function wordType(word) {
  if (names.has(word)) return new Set(['noun']);
  if (word.startsWith('-') && Object.hasOwn(suffixes, word.slice(1))) return new Set(['grammar']);
  if (stems.has(word)) return stems.get(word);
  const pieces = word.split('-');
  if (pieces.length !== 2) throw Error(`Undefined word or unsupported derivation: ${word}`);
  const [stem, ending] = pieces;
  assert(stems.has(stem), `Undefined stem ${stem} in ${word}`);
  if (suffixes[ending]) {
   const [input, output] = suffixes[ending];
   assert(stems.get(stem).has(input), `${word} requires a ${input} stem`);
   return new Set([output]);
  }
  assert(stems.has(ending), `Undefined compound component ${ending}`);
  assert(rows.some(row => row.word.split(' / ').includes(word) && row.notes.startsWith('Defined head-first')), `Undeclared lexical compound ${word}`);
  assert(stems.get(stem).has('noun'), `Compound ${word} needs a noun head`);
  return new Set(['noun']);
 }
 function validate(text) {
  const tokens = text.replace(/[.!?,]/g, '').trim().split(/\s+/).filter(Boolean);
  const stack = [];
  for (const token of tokens) {
   assert(names.has(token) || token.split('-').every(part => native.test(part)), `Invalid native spelling: ${token}`);
   wordType(token);
   if (Object.hasOwn(pairs, token)) {
    assert(!(token === 'kotu' && stack.includes('pusano')), 'Nested direct quotation is unsupported');
    stack.push(pairs[token]);
   } else if (closers.has(token)) assert.equal(stack.pop(), token, `Mismatched closing marker ${token}`);
  }
  assert.equal(stack.length, 0, `Unclosed clauses in ${text}`);
  // Check verb arguments and slot order in a deliberately restricted simple-clause subset.
  // Complex clauses receive boundary and lexical validation above, not a claim of complete parsing.
  if (tokens.some(token => Object.hasOwn(pairs, token))) return;
  assert(!(tokens.includes('pa') && tokens.includes('puti')) && !(tokens.includes('pu') && tokens.includes('pati')) && !(tokens.includes('pati') && tokens.includes('puti')), 'Conflicting time markers in a simple teaching example');
  const verbIndex = tokens.findIndex(token => wordType(token).has('verb') && !['pote','tewa'].includes(token));
  if (verbIndex < 0) return; // A legal dictionary or number phrase can lack a finite verb.
  const adverbs = new Set(['aniki','yami','nuki','potewe','kune']);
  for (let i = 0; i < verbIndex; i++) assert(!adverbs.has(tokens[i]), `Adverb ${tokens[i]} must follow the predicate`);
  for (let i = 0; i < tokens.length; i++) {
   if (tokens[i] === 'solo') assert(tokens[i+1] && !wordType(tokens[i+1]).has('verb'), 'Only must restrict a noun or relation phrase');
  }
  const before = tokens.slice(0, verbIndex);
  const order = [['pa','pu'],['tu','pe'],['no'],['pote','tewa']];
  let last = -1;
  for (const token of before) {
   const slot = order.findIndex(group => group.includes(token));
   if (slot < 0) continue;
   assert(slot > last, `Repeated or out-of-order marker ${token}`); last = slot;
  }
  assert(!tokens.slice(verbIndex + 1).some(token => ['pa','pu','tu','pe','no','pote','tewa'].includes(token)), 'Predicate markers must precede the verb');
  const transitiveExamples = new Set(['sewa','leka','siki','sipa','numa','sapu','pana','kata','tala','teli','nisa','koni','tilita','kausa']);
  const intransitive = new Set(['wata','wena','pala','yuma','somi','sita','tana','wesa','wita','mola','lawo','inia','pina','wati']);
  if(intransitive.has(tokens[verbIndex])) {
   const next=tokens[verbIndex+1];
   assert(!next || ['a','na','po','tawe','natu','katiwe','ka'].includes(next) || wordType(next).has('adverb'), `Unexpected direct object after intransitive ${tokens[verbIndex]}`);
  }
  if (transitiveExamples.has(tokens[verbIndex])) {
   const object = tokens[verbIndex + 1];
   // Commands may omit a contextually understood object; these two teaching forms are explicit exceptions.
   const omitted = ['tala','lati'].includes(tokens[verbIndex]) && (verbIndex === 0 || tokens[0] === 'pali');
   assert(omitted || object && (names.has(object) || wordType(object).has('noun') || wordType(object).has('pronoun') || ['sa','la','ta','to','solo','una','tuli'].includes(object)), `Missing or invalid object after ${tokens[verbIndex]}`);
  }
 }
 return {wordType, validate, stems};
}
function distance(a,b) {
 const row = Array.from({length:b.length+1}, (_,i)=>i);
 for(let i=1;i<=a.length;i++){let previous=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const current=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,previous+(a[i-1]!==b[j-1]));previous=current;}}
 return row[b.length];
}
function check() {
 const rows = loadRows();
 assert.equal(new Set(rows.map(row => row.english)).size, rows.length, 'Duplicate English headwords');
 const baseline = fs.readFileSync(path.join(root,'../Lumena/lexicon.csv'),'utf8').trim().split(/\r?\n/).slice(1).map(line=>line.split(',')[0]).sort();
 assert.deepEqual(rows.map(row=>row.english).sort(),baseline,'English coverage must exactly match Lumena');
 const validator = createValidator(rows);
 for(const row of rows) {
  for(const alternative of row.word.split(' / ')) {
   for(const word of alternative.split(' ')) validator.wordType(word);
   for(const token of alternative.split(/[ -]/).filter(Boolean)) assert(names.has(token)||native.test(token),`Invalid spelling in ${row.english}: ${token}`);
  }
  const example = row.notes.match(/; Example: (.+)$/)?.[1];
  if(example) validator.validate(example);
 }
 for(const name of ['README.md','GRAMMAR.md','LESSONS.md']) {
  const content = fs.readFileSync(path.join(root,name),'utf8');
  for(const match of content.matchAll(/`([^`\n]+)`/g)) validator.validate(match[1]);
  if(name === 'LESSONS.md') for(const line of content.split('\n').filter(line=>line.startsWith('| '))) {
   const cells = line.slice(1,-1).split('|').map(cell=>cell.trim());
   if(cells[0] !== 'Taluma') validator.validate(cells[0]);
  }
 }
 for(const [open,close] of Object.entries(pairs)) assert(distance(open,close)>=3, `Insufficient marker separation ${open}/${close}`);
 const closeList=Object.values(pairs);for(let i=0;i<closeList.length;i++)for(let j=i+1;j<closeList.length;j++)assert(distance(closeList[i],closeList[j])>=3,'Closers too similar');
 for(const bad of ['mi aniki lena','mi solo lena','mi pa pu lena','mi pa lena puti','mi lena pa','mi sewa pona-me','mi wati la ito','mi lena kepi ti lena moteka','mi lena kepi ti lena','mi leka lipo kasime','mi leka lipo aku-me','mi leka lipo lena-ki-mo','mi tala Taluma me senu']) assert.throws(()=>validator.validate(bad),undefined,`Must reject ${bad}`);
 const lookup = english => rows.find(row => row.english === english).word;
 assert.equal(lookup('a / an'),'sa'); assert.equal(lookup('the'),'la'); assert.equal(lookup('manner marker'),'-me');
 for(const [a,b] of [['say','speak'],['number','digit'],['with','together'],['know (a fact)','know (be acquainted)'],['on','over']]) assert.notEqual(lookup(a),lookup(b),`Preserve meaning distinction ${a}/${b}`);
 // Kasi is a defined description, so a bare kasi is a noun modifier; enforce the intended manner contrast separately.
 for(const good of ['mi lena aniki','solo mi lena','mi leka solo la lipo','mi no pote pala','mi tewa kepi mi no pala nasuku','mi sawa kepi li sawa kepi ti lena nasuku nasuku','mi sewa nila yapa','mi sewa nila yapa-me','mi leka lipo kasi-me','lena-ki','lena-mo','siki-po','sola-la','sana-se']) validator.validate(good);
 const outputs = new Map();
 for(const reverse of [false,true]) {
  const title=reverse?'Taluma to English Dictionary':'English to Taluma Dictionary';
  const lines=[`# ${title}`,'',`Taluma ${require('../../versions.json').languages.taluma} — October 18, 2026`,'','Generated from [lexicon.csv](lexicon.csv). Edit that source and run the checker with --write.','','All 397 English lookup entries are retained. Slash-separated forms are sense alternatives; hyphens mark derivation or defined compounds. Read each usage note. See [grammar](GRAMMAR.md) and [lessons](LESSONS.md).','',reverse?'| Taluma | English | Category | Notes |':'| English | Taluma | Category | Notes |','|---|---|---|---|'];
  const key=reverse?'word':'english';
  for(const row of [...rows].sort((a,b)=>a[key].localeCompare(b[key],'en')||a.english.localeCompare(b.english,'en'))) lines.push('| '+[...(reverse?[row.word,row.english]:[row.english,row.word]),row.category,row.notes].map(value=>value.replaceAll('|','\\|')).join(' | ')+' |');
  outputs.set(path.join(root,title+'.md'),lines.join('\n')+'\n');
 }
 for(const name of fs.readdirSync(root).filter(name=>name.endsWith('.md'))) for(const match of fs.readFileSync(path.join(root,name),'utf8').matchAll(/\]\(([^)]+)\)/g)) {
  if(/^(https?:|#)/.test(match[1]))continue;
  const target=path.resolve(root,decodeURIComponent(match[1].split('#')[0]));
  assert(fs.existsSync(target)||process.argv.includes('--write')&&outputs.has(target),`Broken link in ${name}: ${match[1]}`);
 }
 for(const [file,content] of outputs) {
  if(process.argv.includes('--write'))fs.writeFileSync(file,content);
  else assert.equal(fs.readFileSync(file,'utf8'),content,`Stale dictionary ${file}; run with --write`);
 }
 console.log(`OK: Taluma ${rows.length} matching English entries; stems, derivations, examples, marker nesting, scope regressions, links, and dictionaries.`);
}
module.exports={createValidator,distance};
if(require.main===module) {try{check();}catch(error){console.error(error.message);process.exitCode=1;}}
