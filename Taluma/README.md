# Taluma

Version 0.1.0 — October 18, 2026

Taluma is a new auxiliary-language prototype inspired by Lumena's explicit grammar, Narela's regular word building, and Esperanto's productive derivation. It aims for broad learnability through a small sound inventory, stable word order, and clearly documented meanings. These are design goals; no learner study establishes universal ease or superiority.

## Start learning

- [Pronunciation](PRONUNCIATION.md): 14 letters, open syllables, and predictable stress.
- [Grammar](GRAMMAR.md): sentences, scope, word building, and quoted speech.
- [First lessons](LESSONS.md): short conversations and exercises with answers.
- [English to Taluma dictionary](English%20to%20Taluma%20Dictionary.md).
- [Taluma to English dictionary](Taluma%20to%20English%20Dictionary.md).
- [Design and evaluation](DESIGN.md): inheritance, tradeoffs, and a testing plan.
- [Changelog](CHANGELOG.md).

`salo. mi lena Taluma.` — Hello. I learn Taluma.

## A small consistent core

Verbs and nouns do not inflect. There is no grammatical gender or adjective agreement. A/an and the have actual article words: sa and la. Plural ma and numbers make quantity explicit. Six written suffixes build predictable related words without changing the root. Complex clauses have distinct opening and closing words; ordinary short clauses need neither.

## Dictionary scope

The CSV contains exactly the same 397 English lookup entries as Lumena and Narela, including their English wording variants. This is a count of entries, not a claim of 397 independent roots or complete conversational coverage. Related senses may share a form; alternatives are separated with a slash and explained in notes. The English dictionaries and flashcards include every entry.

## Maintenance

Edit [lexicon.csv](lexicon.csv) and the guides. Run node Taluma/tools/check_language.cjs --write, node website/build-data.cjs, and node website/check-site.cjs from the repository root. The checker validates coverage, native spellings, defined stems, restricted derivations, dictionary examples, clause boundaries, links, and generated dictionaries. It includes negative regression cases, but is not a complete natural-language parser or a test of learner outcomes.

New roots require a sense definition, argument frame where relevant, example, sound-confusion review, and changelog entry. Keep spellings stable during trials. The other three languages remain separate; similar words do not authorize mixing their rules.
