# Narela

Version 0.1 — October 17, 2026

Narela is an original auxiliary language prototype with invariant verbs, subject–verb–object order, a plural ending, and a practical starter vocabulary. This edition reorganizes the original document into the same reference format as Lumena while retaining Narela's words and core rules.

Start with [pronunciation](PRONUNCIATION.md), then [lessons](LESSONS.md). Consult the [grammar](GRAMMAR.md), [English dictionary](English%20to%20Narela%20Dictionary.md), [reverse dictionary](Narela%20to%20English%20Dictionary.md), and [design notes](DESIGN.md).

## At a glance

- Five steady vowels; consonant clusters and final consonants are allowed.
- Subject–verb–object word order and invariant verbs.
- Plural -n; optional after a numeral.
- Optional articles un and la.
- Gender-neutral third-person pronouns.

## Files and maintenance

lexicon.csv is the vocabulary source of truth. Both dictionaries are generated from it. From the workspace root run:

~~~powershell
node Narela/tools/check_language.cjs --write
node Narela/tools/check_language.cjs
~~~

The checker verifies unique entries, native spelling, example vocabulary, local links, and dictionary freshness. It permits Narela's documented plural and word-building rules. It cannot judge naturalness or learning outcomes. See [CHANGELOG.md](CHANGELOG.md) for changes.
