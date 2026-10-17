# Language library

Open [index.html](index.html) in a browser. The website works directly from disk, without a server, installation, external fonts, or a network connection. JavaScript enables language switching, reference navigation, dictionary search, category filters, and pagination.

## Refresh content

The language folders are the source of truth; data.js is a generated snapshot that makes direct file opening possible. From the workspace root, after editing either language:

```powershell
node Narela/tools/check_language.cjs --write
node Lumena/tools/check_language.cjs --write
node website/build-data.cjs
node website/check-site.cjs
```

Use node website/build-data.cjs --check to detect a stale snapshot without writing it. The builder consumes both lexicons and all six reference documents per language. It never edits their source files. The website does not pretend to translate arbitrary sentences or synthesize accurate pronunciation.

## Files

- index.html: semantic page structure and navigation.
- styles.css: responsive layouts, readable type, focus states, and print styles.
- app.js: browser rendering and interactions.
- data.js: generated language content, loaded as a classic script for file compatibility.
- build-data.cjs: standard-library-only content builder.
- check-site.cjs: source and behavior checks.

Layout uses system fonts and CSS shapes. There are no external runtime services, tracking, accounts, or dependencies.

## GitHub Pages

`node website/build-site.cjs` stages public assets and language references in `.site-build/`, with paths adjusted for hosting at the repository URL. GitHub Actions runs validation and builds this directory before publishing it through GitHub Pages. Pull requests run the same checks without deploying. Keep Pages configured to use GitHub Actions.
