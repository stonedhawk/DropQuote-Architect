# Changelog

All notable changes to DropQuote Architect will be documented in this file.

The format is loosely based on Keep a Changelog and uses semantic versioning for playable milestones on this project.

## [0.2.0] - 2026-04-24

This release marks the first solid **playable alpha tuning milestone** after the initial prototype. The focus of this version is gameplay trust: broader word recognition, cleaner documentation, and a clearer path toward a fairer, more fun word-building loop.

### Added

- broader gameplay validation through an imported game-ready small-tier dictionary source
- generated `valid-gameplay-words.json` runtime backbone for accepted words
- `player-expected-words.json` source for everyday word and plural expectation coverage
- `build:wordlist` script for regenerating the gameplay validation dictionary
- stronger dictionary regression coverage for common words, plural forms, and source integration proof
- refreshed README with clearer game pitch, controls, live status, and next-step roadmap

### Changed

- word validation now separates:
  - `core` assist words for onboarding and spawn bias
  - broader `valid gameplay words` for runtime acceptance
- reverse horizontal and vertical words are part of normal gameplay validation
- fun-first spawn tuning now biases toward easier completion opportunities after the opener
- early pressure pacing and objective unlock timing were softened to reduce frustration

### Fixed

- obvious missing words such as `COD`, `GUN`, `GUNS`, and `SOS`
- several expected plural and everyday-word gaps through the curated gameplay validation pass
- test coverage gaps where dictionary integration was not being explicitly proven

### Notes

- this is still an alpha-quality balancing phase rather than a content-complete release
- the next major focus is continued dictionary trust, playtesting around expected words, and further spawn/balance tuning
