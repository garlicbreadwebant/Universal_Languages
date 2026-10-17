# Review, evidence, and design decisions

## Repository review

The supplied workspace initially contained `Narela/English to New Language Dictionary.md` and an empty `Universal/` directory. The Narela file was subsequently observed at `Narela/English to Narela Dictionary.md`; this work did not rename it. The root dictionary shown in the IDE tab list was not present on disk during review. Narela's single document combines pronunciation, 14 grammar rules, thematic vocabulary tables, numbers, and sample sentences. Its strengths are invariant verbs, a clear starter scope, useful phrases, and instructions to check new words.

| Finding in Narela | Consequence | Lumena response |
|---|---|---|
| “Usual English sounds”; no explicit inventory | Learners need English knowledge to interpret letters; x and y need clarification | Explicit letter-to-IPA table and articulatory guidance |
| Clusters in klosa, stana, tru, blu; closed syllables in numbers | Additional production demands for learners unfamiliar with these sequences | Native (C)V syllables only |
| Plural -n plus min/tin/lin | Adds final consonants and a morphological rule | Separate optional plural marker; independent plural pronouns |
| Present “unmarked” | May force a present reading even when context supplies past | Unmarked time is context-dependent |
| No full rules for relative or content clauses | Difficult to express everyday complex thoughts predictably | Overt opening/closing particles and explicit resumed relative role |
| Short definitions and no verb argument frames | Hidden English assumptions about meaning and objects | Narrower senses and argument notes in CSV |
| Grammar and lexicon in one manually edited file | Conflicts become harder to detect as vocabulary grows | Source CSV, generated dictionaries, focused documents and checker |
| Many visibly European-looking words | Unequal familiarity; no evidence of globally balanced recognition | Treat forms as provisional; do not claim neutral or globally familiar vocabulary |

These are design limitations, not evidence that Narela cannot be learned. Lumena is a separate design and is not backward-compatible with Narela; similar spellings may have different meanings. Do not mix the two dictionaries.

## What research supports, and what it does not

The following are primary descriptive or research sources, accessed October 17, 2026. The proposed rules are design inferences, not prescriptions from these sources.

- Ian Maddieson, [WALS chapter 2: Vowel Quality Inventories](https://wals.info/chapter/2): five-vowel inventories are the most frequent individual size in this sample, but occur in only about a third of sampled languages. We choose /a e i o u/ as a manageable compromise; this does not make all five vowels familiar to everyone.
- Maddieson, [WALS chapter 12: Syllable Structure](https://wals.info/chapter/12): languages differ in permitted consonant and vowel sequences. Choosing open syllables avoids clusters in native words; the cost is longer words and a smaller supply of short distinct forms.
- Matthew Dryer, [WALS chapter 81: Order of Subject, Object and Verb](https://wals.info/chapter/81): subject–object–verb and subject–verb–object are both widely represented patterns. We choose one fixed SVO order for predictability, not because it is universal or demonstrably easiest.
- Maddieson, [WALS chapter 13: Tone](https://wals.info/chapter/13): tone systems vary across languages. Omitting lexical tone removes a contrast for learners whose languages lack it; it sacrifices information-carrying capacity and does not imply tonal languages are inferior.
- [Second Language Phonology, Cambridge University Press](https://www.cambridge.org/core/books/second-language-phonology/988842E51A7BC87179025DA57DAD854E): research treats acquisition of speech categories as sensitive to learners' language experience and input. We therefore require cross-background trials and intelligibility work instead of claiming a universal easiest inventory.

WALS counts languages in its samples, not populations of learners, and does not measure learning time for this constructed language. Typological frequency is a design input, not proof of learnability. No source establishes Lumena as optimal.

## Optimization priorities

1. Understandable communication and easy recovery after misunderstanding.
2. Predictable rules and minimal obligatory memorization of exceptions.
3. Reasonable speaking effort, typing effort, and vocabulary size.
4. Concision where it does not create recurring ambiguity.

Nine consonants avoid a required r/l or voiced/unvoiced stop distinction. This is a hypothesis about useful simplification, not a claim that each retained sound is universal. Restricting sounds increases near-neighbor words; the vocabulary needs listening trials. Short particles save syllables but can be hard to hear. Explicit clause closers cost syllables and require training. Mandatory copulas and fixed word order reduce some interpretation choices while favoring learners familiar with those patterns.

Roots are provisional constructed labels, including adaptations retained from Narela and forms resembling words in multiple languages. No systematic etymological balancing or legal/name clearance has been completed. Avoid invented claims that the lexicon represents every continent. A globally inclusive vocabulary process needs paid participation, multilingual teaching materials, and community authority over future changes.

## Evaluation before a stable release

Recruit consenting adults across unrelated language families, scripts, literacy levels, and accessibility needs. Include speakers with backgrounds such as Arabic, Mandarin, Hindi, Spanish, Swahili, Indonesian, Japanese, and additional underrepresented languages; this illustrative list is not representative by itself. Consult educators and disabled users about formats and task design.

Run a small pilot first, then use its variance to plan sample sizes and preregister the larger comparison. Give equal instruction time and comparable vocabulary exposure. Counterbalance matched learning tasks against Narela or another explicitly chosen baseline; account for prior language-learning experience. Test both first encounters and delayed retention.

Measure successful information transfer in directions, requests, and short narratives; time to complete tasks; comprehension accuracy; requests for repetition; word confusions; delayed recall; and learner-reported effort. Evaluate mixed-background speaker/listener pairs and noisy conditions, not only written exercises or imitation of an instructor. Report outcomes separately by learner group as well as overall; a favorable average can hide substantial disadvantage.

Before the trial, specify acceptable accuracy and burden thresholds with participants and instructors. Revise confusable roots and rules using observed errors. Release anonymized methods and aggregate results with consent; collect only necessary personal data. No real learner evaluation or audio intelligibility testing has been performed for version 0.1.
