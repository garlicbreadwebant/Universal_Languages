# Narela design notes

## Scope of this edition

The original Narela starter combined pronunciation, 14 grammar rules, vocabulary, numbers, and examples in one English-first dictionary. This edition separates those sections into focused documents and adds a CSV vocabulary source, a generated reverse dictionary, practice exercises, and a validator.

All 238 original vocabulary entries and their spellings are retained. Core grammar and sentence translations are preserved. Pronunciation now explicitly documents previously underspecified x, y, r, and h; this reference clarification needs learner review.

## Design choices

Invariant verbs reduce conjugation rules. Fixed word order gives learners a consistent sentence template. Optional articles and regular plural -n offer familiar patterns for some learners, while consonant clusters, final consonants, and English-based teaching guidance may increase effort for others.

Narela's vocabulary includes many European-looking forms. Familiarity for one group is not evidence of global neutrality. Regular grammar alone cannot establish that a language is easy for everyone.

## Relationship to Lumena

Narela is a separate language, not a spelling variant of Lumena. Lumena uses a smaller sound inventory, separate plural marking, and explicit embedded-clause conventions. Read the [Lumena design review](../Lumena/DESIGN.md) for the comparison and research sources. Do not automatically transfer its rules to Narela.

## Open questions and evaluation

Verb argument patterns, relative clauses, embedded speech, large numbers, and negation scope need further specification before a stable release. Test pronunciation, comprehension, delayed vocabulary recall, and communication tasks with learners across language backgrounds and literacy levels. Compare equal instruction time and report subgroup outcomes. No empirical learner trial has been completed for this edition.
