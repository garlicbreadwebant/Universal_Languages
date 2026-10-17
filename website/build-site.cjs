// Stage only public website assets and language references for GitHub Pages.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, '.site-build');
fs.mkdirSync(out, {recursive: true});
for (const name of ['index.html', 'styles.css', 'ai.css', 'app.js', 'data.js', 'ai-client.js', 'ai-ui.js', 'favicon.svg']) {
  fs.copyFileSync(path.join(__dirname, name), path.join(out, name));
}
for (const name of ['Lumena', 'Narela']) {
  const target = path.join(out, name);
  fs.mkdirSync(target, {recursive: true});
  for (const file of fs.readdirSync(path.join(root, name))) {
    if (/\.(md|csv)$/.test(file)) fs.copyFileSync(path.join(root, name, file), path.join(target, file));
  }
}
fs.copyFileSync(path.join(root, 'README.md'), path.join(out, 'README.md'));
fs.copyFileSync(path.join(root, 'CONTRIBUTING.md'), path.join(out, 'CONTRIBUTING.md'));
fs.writeFileSync(path.join(out, '.nojekyll'), '');
// Source files live one level below the repository root; the deployed site does not.
for (const file of ['app.js', 'index.html']) {
  const target = path.join(out, file);
  fs.writeFileSync(target, fs.readFileSync(target, 'utf8').replaceAll('../', './'));
}
console.log('Built GitHub Pages site in .site-build');
