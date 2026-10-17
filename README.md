# Universal Languages

Explore two constructed language prototypes. Learn your first words, search the dictionaries, and help improve the languages through real learner feedback.

**[Explore the Language Library](https://garlicbreadwebant.github.io/Universal_Languages/)** · [Start contributing](CONTRIBUTING.md) · [Share feedback](https://github.com/garlicbreadwebant/Universal_Languages/issues)

## Pick a language

- [Narela](Narela/README.md): original starter language, organized into reference guides and bidirectional dictionaries.
- [Lumena](Lumena/README.md): international auxiliary language prototype, with a separate specification, lessons, dictionary, and validation tools.
- [Review and design evidence](Lumena/DESIGN.md): assessment of Narela, research sources, tradeoffs, and learner testing plan.
- [Language library website](website/index.html): browse both languages, search their dictionaries, and read their guides. Open directly in a browser.

Lumena is intended as an additional shared language. Its global learnability is a design objective requiring evidence from diverse learners.

Both language folders share README, PRONUNCIATION, GRAMMAR, LESSONS, DESIGN, CHANGELOG, lexicon.csv, two generated dictionaries, and tools/check_language.cjs. See [website instructions](website/README.md) to refresh the browser content after editing source files.

## Learn, practice, contribute

- **Learners:** begin with [Lumena lessons](https://garlicbreadwebant.github.io/Universal_Languages/#lumena/lessons) or [Narela lessons](https://garlicbreadwebant.github.io/Universal_Languages/#narela/lessons), then use the searchable dictionary.
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
