// Enforce the same English lookup vocabulary across every language, using source CSVs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const names = ['Lumena', 'Narela', 'Esperanto', 'Taluma'];
function checkVocabulary() {
 const sets = names.map(name => {
  const lines = fs.readFileSync(path.join(root, name, 'lexicon.csv'), 'utf8').trim().split(/\r?\n/);
  assert.equal(lines.shift(), `english,${name.toLowerCase()},category,notes`);
  const english = lines.map((line, i) => {
   const fields = line.split(',');
   assert(fields.length === 4 && fields.every(field => field.trim() && !field.includes('"')), `${name} malformed row ${i + 2}`);
   return fields[0];
  });
  assert.equal(new Set(english).size, english.length, `${name} duplicate English headwords`);
  return new Set(english);
 });
 const union = new Set(sets.flatMap(set => [...set]));
 for (const [index, name] of names.entries()) {
  const missing = [...union].filter(word => !sets[index].has(word));
  assert.equal(missing.length, 0, `${name} missing English headwords: ${missing.join('; ')}`);
 }
 return union.size;
}
module.exports = {checkVocabulary};
if (require.main === module) console.log(`OK: ${checkVocabulary()} English headwords available in all ${names.length} source lexicons.`);
