# Lumena

Version 0.2.0 — October 18, 2026

Lumena is a proposed international auxiliary language designed for predictable speech, regular grammar, and practical communication. The working name is pronounced /luˈmena/. It is an original prototype, not an established community language or a demonstrated optimum for all people.

Start with [pronunciation](PRONUNCIATION.md), then the [first lessons](LESSONS.md). Consult the [grammar](GRAMMAR.md), [English dictionary](English%20to%20Lumena%20Dictionary.md), and [reverse dictionary](Lumena%20to%20English%20Dictionary.md). [Design notes](DESIGN.md) explain the choices and limitations.

## At a glance

- Five vowels and nine consonants; no consonant clusters or final consonants.
- Fixed spelling and predictable stress; pitch and vowel length do not change meaning.
- Subject–verb–object sentences; unchanged verbs and nouns.
- Optional time and number markers, with explicit forms whenever precision matters.
- Gender-neutral pronouns, no grammatical gender, no noun classes, no agreement.
- Separate words for grammatical operations; no irregular conjugations or mandatory articles.

`mi lena Lumena.` — I learn Lumena.

`ti no kowa ka?` — Do you not understand?

`pali tala senu.` — Please speak slowly.

## Files and maintenance

`lexicon.csv` is the vocabulary source of truth. The two Markdown dictionaries are generated from it and include every entry. Edit the CSV, then run:

```powershell
node Lumena/tools/check_language.cjs --write
node Lumena/tools/check_language.cjs
```

The checker verifies unique headwords, sound patterns, example vocabulary, local Markdown links, and generated dictionary freshness. It cannot establish naturalness, translation quality, or learner outcomes.

New roots need a narrow definition, grammatical category, example, pronunciation check, collision check, and learner review. Record accepted changes in [CHANGELOG.md](CHANGELOG.md). Keep the core stable during a learning trial; publish breaking changes with a migration table. Technical vocabulary, recordings, translations of these English teaching materials, and independently reviewed accessibility materials remain future work.
