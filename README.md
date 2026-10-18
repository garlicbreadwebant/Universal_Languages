# Universal Languages

Explore Lumena, Narela, and Taluma, three constructed language prototypes, alongside the established international auxiliary language Esperanto. Learn your first words, search the dictionaries, and help improve the languages through real learner feedback.

**[Explore the Language Library](https://garlicbreadwebant.github.io/Universal_Languages/)** · [Start contributing](CONTRIBUTING.md) · [Share feedback](https://github.com/garlicbreadwebant/Universal_Languages/issues)

## Pick a language

Licensed under the [MIT License](LICENSE). Website changes are recorded in the [website changelog](website/changelog.md).

- [Narela](Narela/README.md): original starter language, organized into reference guides and bidirectional dictionaries.
- [Lumena](Lumena/README.md): international auxiliary language prototype, with a separate specification, lessons, dictionary, and validation tools.
- [Taluma](Taluma/README.md): new synthesis with regular derivation, explicit grammar, and a shared 397-entry English vocabulary.
- [Esperanto](Esperanto/README.md): established international auxiliary language with beginner guides, lessons, and bidirectional dictionaries.
- [Review and design evidence](Lumena/DESIGN.md): assessment of Narela, research sources, tradeoffs, and learner testing plan.
- [Language library website](website/index.html): browse all four languages, search their dictionaries, and read their guides. Open directly in a browser.

Lumena is intended as an additional shared language. Its global learnability is a design objective requiring evidence from diverse learners.

All four language folders share README, PRONUNCIATION, GRAMMAR, LESSONS, DESIGN, CHANGELOG, lexicon.csv, two generated dictionaries, and tools/check_language.cjs. See [website instructions](website/README.md) to refresh the browser content after editing source files.

Each collection covers the same 397 English lookup entries in its dictionaries, flashcards, and AI learning references. Original English labels are retained, including lookup variants. Usage notes explain alternative senses and grammatical constructions that have no single-word equivalent. Shared coverage is checked with `node tools/check-vocabulary.cjs` and enforced during website builds.

## Learn, practice, contribute

- **Learners:** begin with [Lumena lessons](https://garlicbreadwebant.github.io/Universal_Languages/#lumena/lessons), [Narela lessons](https://garlicbreadwebant.github.io/Universal_Languages/#narela/lessons), [Esperanto lessons](https://garlicbreadwebant.github.io/Universal_Languages/#esperanto/lessons), or [Taluma lessons](https://garlicbreadwebant.github.io/Universal_Languages/#taluma/lessons), then use the searchable dictionary.
- **Speakers and educators:** try the examples, compare the pronunciation guides, and tell us what needs a clearer explanation.
- **Language contributors:** suggest improvements with concrete examples and respect for diverse language backgrounds.
- **Maintainers:** help with accessible interfaces, data validation, documentation, and issue review. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Run locally

Open `website/index.html` in a browser. No installation or server is needed to explore. To validate or build the publication, use Node.js 22 or later:

```sh
node website/check-site.cjs
node website/build-site.cjs
```

GitHub Actions validates pull requests and deploys the website to GitHub Pages after changes reach `master`. The website uses system fonts and has no tracking, external runtime dependencies, or accounts.
