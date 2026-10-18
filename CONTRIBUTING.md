# Help shape a shared language

Learners, speakers, linguists, educators, designers, and maintainers are welcome. Lumena, Narela, and Taluma are prototypes; Esperanto follows established usage; thoughtful observations matter more than prior experience.

## Choose a first contribution

- **Learn:** try a first lesson and report where you hesitated. Include your language background if you are comfortable sharing it.
- **Speak:** practice an example aloud and suggest clearer pronunciation guidance. Describe the sounds you found difficult.
- **Review:** propose vocabulary or grammar improvements with examples and a reason for the change.
- **Build:** improve accessibility, mobile layouts, dictionary search, or documentation.
- **Maintain:** review issues, verify examples, and help keep reference documents consistent.

Open an issue before a substantial language redesign. Small corrections can go straight to a pull request. Please keep discussion welcoming, specific, and respectful of different language backgrounds. Do not claim global ease of learning without evidence.

## Source of truth

Edit the Markdown guides and `lexicon.csv` in `Lumena/`, `Narela/`, `Esperanto/`, or `Taluma/`. Dictionary Markdown files and `website/data.js` are generated. Keep the four languages distinct and explain any intentional compatibility change in the relevant changelog.

All four lexicons must expose the same English headwords. Add a reviewed translation or an explicitly explained grammatical construction to each language when adding an English sense. Different English lookup variants can share a native form; English headwords must stay unique. Run `node tools/check-vocabulary.cjs` to see missing coverage. The website builder also enforces this rule before producing dictionary, flashcard, and AI reference data. Do not use placeholder translations to satisfy the check.

With Node.js 22 or later, run from the repository root:

```sh
node Narela/tools/check_language.cjs --write
node Lumena/tools/check_language.cjs --write
node Esperanto/tools/check_language.cjs --write
node Taluma/tools/check_language.cjs --write
node website/build-data.cjs
node website/check-site.cjs
node website/build-site.cjs
```

Open `website/index.html` locally. The `.site-build` directory contains the published layout. No packages or accounts are required to work on the website.

## Pull requests

Explain the problem, the proposed improvement, and how you checked it. For language changes, give a before/after example. For interface changes, include screenshots where possible and check keyboard navigation and a narrow mobile viewport. GitHub Actions validates contributions; merging into `master` publishes the site.
