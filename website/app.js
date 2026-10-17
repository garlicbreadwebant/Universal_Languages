/* Plain JavaScript; all language content is rendered as escaped text. */
(function (global) {
  'use strict';
  const pages = {overview: 'Overview', dictionary: 'Dictionary', pronunciation: 'Pronunciation', grammar: 'Grammar', lessons: 'First lessons', design: 'Design notes', changelog: 'Changelog'};
  const documentFiles = {overview: 'README.md', pronunciation: 'PRONUNCIATION.md', grammar: 'GRAMMAR.md', lessons: 'LESSONS.md', design: 'DESIGN.md', changelog: 'CHANGELOG.md'};
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const normalize = value => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function filterEntries(entries, query, category) {
    const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
    return entries.filter(entry => (!category || entry.category === category) && terms.every(term => normalize([entry.english, entry.word, entry.category, entry.notes].join(' ')).includes(term)));
  }
  function parseRoute(hash, data) {
    const [language, page] = hash.replace(/^#/, '').split('/');
    return {language: Object.hasOwn(data, language) ? language : 'lumena', page: Object.hasOwn(pages, page) ? page : 'overview'};
  }
  function safeLink(target, language) {
    let decoded;
    try { decoded = decodeURIComponent(target); } catch { return null; }
    if (/^https?:\/\//i.test(decoded)) return decoded;
    if (/^[a-z]+:/i.test(decoded) || decoded.startsWith('//') || decoded.includes('\\')) return null;
    const cross = decoded.match(/^\.\.\/(Lumena|Narela)\/([^#]+)$/);
    const owner = cross ? cross[1].toLowerCase() : language;
    const file = cross ? cross[2] : decoded;
    const page = Object.keys(documentFiles).find(key => documentFiles[key] === file);
    if (page) return `#${owner}/${page}`;
    if (/Dictionary\.md$/.test(file)) return `#${owner}/dictionary`;
    if (file === 'lexicon.csv') return `../${owner === 'lumena' ? 'Lumena' : 'Narela'}/lexicon.csv`;
    return null;
  }
  // A deliberately small Markdown renderer for the repository's document format.
  // Raw HTML is always escaped. Only HTTP(S) and known local documents become links.
  function inline(text, language) {
    const tokens = /`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
    let output = '', cursor = 0;
    for (const match of text.matchAll(tokens)) {
      output += escape(text.slice(cursor, match.index));
      if (match[1] !== undefined) output += `<code>${escape(match[1])}</code>`;
      else if (match[2] !== undefined) {
        const link = safeLink(match[3], language);
        output += link ? `<a href="${escape(link)}">${escape(match[2])}</a>` : escape(match[2]);
      } else output += `<strong>${escape(match[4])}</strong>`;
      cursor = match.index + match[0].length;
    }
    return output + escape(text.slice(cursor));
  }
  function markdown(source, language) {
    const lines = source.replace(/\r/g, '').split('\n');
    let out = '', i = 0;
    const cells = line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(s => s.trim());
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i++; continue; }
      if (/^(```|~~~)/.test(line)) {
        const fence = line.slice(0, 3); const block = []; i++;
        while (i < lines.length && !lines[i].startsWith(fence)) block.push(lines[i++]);
        i++; out += `<pre><code>${escape(block.join('\n'))}</code></pre>`; continue;
      }
      const heading = line.match(/^(#{1,6})\s+(.*)$/);
      if (heading) { const level = heading[1].length; out += `<h${level}>${inline(heading[2], language)}</h${level}>`; i++; continue; }
      if (line.startsWith('|') && /^\|[\s:|\-]+$/.test(lines[i + 1] || '')) {
        const header = cells(line); i += 2;
        out += `<div class="table-scroll" role="region" aria-label="Reference table" tabindex="0"><table><thead><tr>${header.map(s => `<th scope="col">${inline(s, language)}</th>`).join('')}</tr></thead><tbody>`;
        while (i < lines.length && lines[i].startsWith('|')) out += `<tr>${cells(lines[i++]).map(s => `<td>${inline(s, language)}</td>`).join('')}</tr>`;
        out += '</tbody></table></div>'; continue;
      }
      const ordered = /^\d+\.\s+/.test(line), unordered = /^-\s+/.test(line);
      if (ordered || unordered) {
        const tag = ordered ? 'ol' : 'ul';
        const marker = ordered ? /^\d+\.\s+/ : /^-\s+/;
        out += `<${tag}>`;
        while (i < lines.length && marker.test(lines[i])) out += `<li>${inline(lines[i++].replace(marker, ''), language)}</li>`;
        out += `</${tag}>`; continue;
      }
      const paragraph = [line]; i++;
      while (i < lines.length && lines[i].trim() && !/^(#|\||```|~~~|-\s|\d+\.\s)/.test(lines[i])) paragraph.push(lines[i++]);
      out += `<p>${inline(paragraph.join(' '), language)}</p>`;
    }
    return out;
  }
  // Pure helpers are exported for the dependency-free checks.
  const helpers = {filterEntries, parseRoute, safeLink, markdown};
  if (typeof module !== 'undefined' && module.exports) module.exports = helpers;
  if (!global.document) return;
  const data = global.LANGUAGE_DATA;
  const main = document.getElementById('main');
  if (!data) { main.innerHTML = '<h1>The library could not load</h1><p>Keep data.js beside index.html and reload the page.</p>'; return; }
  let state = parseRoute(location.hash, data);
  let query = '', category = '', pageNumber = 1;
  const pageSize = 40;
  const route = page => `#${state.language}/${page}`;
  const announce = message => { document.getElementById('announcement').textContent = message; };
  function overview(lang) {
    return `<section class="hero" aria-labelledby="page-title"><div><p class="eyebrow">A LANGUAGE TO EXPLORE · ${escape(lang.name)}</p><h1 id="page-title" tabindex="-1">A small world.<br><em>A shared word.</em></h1><p class="lead">${escape(lang.tagline)} ${escape(lang.description)} Discover the words, learn the patterns, and try your first conversation.</p><div class="actions"><a class="button" href="${route('lessons')}">Start learning <span aria-hidden="true">↗</span></a><a class="button secondary" href="${route('dictionary')}">Explore dictionary</a></div></div><div class="word-art"><span class="art-tag">YOUR FIRST WORD</span><span class="word">${escape(lang.greeting)}</span><span class="word-caption">Hello. A place to begin.</span><span class="art-dot" aria-hidden="true"></span></div></section>
      <div class="fact-strip"><span><strong>${lang.entries.length}</strong> dictionary entries</span>${lang.facts.map(f => `<span>${escape(f)}</span>`).join('')}<span>Edition 0.1</span></div>
      <div class="section-heading"><h2>Find your way into ${escape(lang.name)}</h2><span>A little curiosity goes a long way</span></div>
      <div class="explore-grid">${[
        ['01', 'dictionary', 'Discover the words', 'Find an everyday word, explore its meaning, and build your vocabulary.', 'Open dictionary'],
        ['02', 'pronunciation', 'Get to know the sounds', 'Meet the letters and learn how words are pronounced.', 'Explore pronunciation'],
        ['03', 'grammar', 'See the patterns', 'Build clear sentences with consistent rules and practical examples.', 'Read the grammar']
      ].map(([number, page, title, desc, label]) => `<a class="explore-card" href="${route(page)}"><span class="card-number">${number} /</span><h3>${title}</h3><p>${desc}</p><span class="card-link">${label} <span aria-hidden="true">↗</span></span></a>`).join('')}</div>
      <section class="example-panel" aria-label="A sentence to try"><div><p class="eyebrow">A SENTENCE TO TRY</p><p class="example">${escape(lang.example)}</p><p class="translation">${escape(lang.translation)}</p></div><p class="example-note">Every conversation begins somewhere.<br><a href="${route('lessons')}">Try the first lessons →</a></p></section><p class="edition-note">${escape(lang.name)} is a language prototype. Its learnability across language backgrounds still needs real-world testing. <a href="${route('design')}">Read the design notes.</a></p>`;
  }
  function dictionary(lang) {
    const categories = [...new Set(lang.entries.map(e => e.category))].sort();
    return `<header class="page-header"><p class="eyebrow">WORDS FOR YOUR WORLD</p><h1 id="page-title" tabindex="-1">The ${escape(lang.name)} dictionary</h1><p>Search in English or ${escape(lang.name)}. Each entry includes its category and usage notes. This is a word reference, rather than an automatic sentence translator.</p></header>
      <div class="dictionary-controls"><div class="field"><label for="search">Find a word or meaning</label><div class="search-wrap"><input id="search" type="search" placeholder="Try water, hello, or learn…" value="${escape(query)}" autocomplete="off" spellcheck="false"><button id="clear-search" type="button" aria-label="Clear search">Clear</button></div></div><div class="field"><label for="category">Word category</label><select id="category"><option value="">All categories</option>${categories.map(c => `<option value="${escape(c)}"${category === c ? ' selected' : ''}>${escape(c)}</option>`).join('')}</select></div></div>
      <div class="result-bar"><span id="result-count" role="status" aria-live="polite"></span><a href="../${lang.name}/lexicon.csv" download>Download vocabulary CSV ↗</a></div>
      <div id="dictionary-results"></div>`;
  }
  function renderResults() {
    const lang = data[state.language];
    const filtered = filterEntries(lang.entries, query, category).sort((a, b) => a.english.localeCompare(b.english, 'en'));
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    pageNumber = Math.min(Math.max(1, pageNumber), totalPages);
    const start = (pageNumber - 1) * pageSize;
    document.getElementById('result-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'entry' : 'entries'}${query ? ` matching “${query}”` : ''}`;
    const result = document.getElementById('dictionary-results');
    if (!filtered.length) {
      result.innerHTML = '<div class="empty-state"><strong>No words found</strong>Try a shorter word, another meaning, or choose all categories.</div>';
      return;
    }
    result.innerHTML = `<div class="table-scroll" role="region" aria-label="Dictionary results" tabindex="0"><table><caption class="sr-only">English to ${escape(lang.name)} dictionary</caption><thead><tr><th scope="col">English</th><th scope="col">${escape(lang.name)}</th><th scope="col">Category</th><th scope="col">Usage notes</th></tr></thead><tbody>${filtered.slice(start, start + pageSize).map(e => `<tr><td>${escape(e.english)}</td><td class="word-cell">${escape(e.word)}</td><td><span class="category-tag">${escape(e.category)}</span></td><td class="entry-notes">${escape(e.notes)}</td></tr>`).join('')}</tbody></table></div><div class="pagination"><span>${start + 1}–${Math.min(start + pageSize, filtered.length)} of ${filtered.length} entries</span><div><button id="previous-page" type="button" ${pageNumber === 1 ? 'disabled' : ''}>← Previous</button> <span>Page ${pageNumber} of ${totalPages}</span> <button id="next-page" type="button" ${pageNumber === totalPages ? 'disabled' : ''}>Next →</button></div></div>`;
    for (const [id, delta] of [['previous-page', -1], ['next-page', 1]]) {
      document.getElementById(id).addEventListener('click', () => {
        pageNumber += delta; renderResults();
        const table = result.querySelector('.table-scroll'); table.focus();
        announce(`Dictionary page ${pageNumber} of ${totalPages}`);
      });
    }
  }
  function render(focus = false) {
    const lang = data[state.language];
    document.title = `${pages[state.page]} · ${lang.name} · Language Library`;
    document.getElementById('current-language').textContent = lang.name;
    document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === state.language)));
    document.querySelectorAll('[data-page]').forEach(link => {
      link.href = route(link.dataset.page);
      if (link.dataset.page === state.page) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    if (state.page === 'overview') main.innerHTML = overview(lang);
    else if (state.page === 'dictionary') {
      main.innerHTML = dictionary(lang);
      const search = document.getElementById('search');
      search.addEventListener('input', () => { query = search.value; pageNumber = 1; renderResults(); });
      document.getElementById('category').addEventListener('change', event => { category = event.target.value; pageNumber = 1; renderResults(); });
      document.getElementById('clear-search').addEventListener('click', () => { query = ''; search.value = ''; pageNumber = 1; renderResults(); search.focus(); });
      renderResults();
    } else {
      main.innerHTML = `<p class="eyebrow">${escape(lang.name)} / THE REFERENCE COLLECTION</p><a class="source-link" href="../${lang.name}/${documentFiles[state.page]}">Read the Markdown source ↗</a><article class="document">${markdown(lang.documents[state.page], state.language)}</article>`;
      const title = main.querySelector('h1'); if (title) { title.id = 'page-title'; title.tabIndex = -1; }
    }
    if (focus) { const title = main.querySelector('h1'); if (title) title.focus(); }
  }
  document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.language !== state.language) location.hash = `${button.dataset.language}/${state.page}`;
  }));
  global.addEventListener('hashchange', () => {
    const next = parseRoute(location.hash, data);
    if (next.language !== state.language) { category = ''; query = ''; }
    state = next; pageNumber = 1; render(true);
  });
  render();
})(typeof window !== 'undefined' ? window : globalThis);
