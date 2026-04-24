# DropQuote Architect

DropQuote Architect is a bright arcade word-builder where falling letter tiles lock into a live board, words clear space, pressure speeds the game up, and power-ups help you stay alive.

![DropQuote Architect gameplay screenshot](docs/images/dropquote-architect-gameplay.png)

## Play It

- Live site: [https://stonedhawk.github.io/DropQuote-Architect/](https://stonedhawk.github.io/DropQuote-Architect/)
- Local dev server: `npm run dev`

## What Makes It Fun

- Real-time falling letters instead of turn-based word entry
- Horizontal and vertical word clears
- Reverse words count too
- Cascades can chain into bonus clears
- Pressure rises as the board gets denser
- Ink lets you buy tactical power-ups mid-run

This project is also a technical playground for high-frequency React state updates using Redux Toolkit entity state, discrete tick-based simulation, and a charted pressure HUD.

## How To Play

Your goal is simple: guide each falling letter into place so that, after it locks, it completes a valid word of at least 3 letters.

Important rules:

- Words clear only after the active tile locks
- Words must be straight, not diagonal
- Horizontal and vertical words both count
- Forward and reverse reading both count
- Clearing words opens space and can trigger cascades
- If Pressure reaches `100%`, the run ends

Examples of words the current game accepts include:

`CAT`, `DOG`, `SUN`, `STAR`, `CODE`, `GAME`, `WORD`, `COD`, `GUN`, `GUNS`, `SOS`

## Controls

Keyboard:

- `Left Arrow` / `Right Arrow`: move tile
- `Down Arrow`: soft drop
- `Space`: hard drop
- `1`, `2`, `3`: use a power-up from inventory
- `C`: clear the queued next-drop modifier

Touch support:

- Tap a column: move toward that lane
- Swipe down: soft drop
- Double tap: hard drop

## Power-Ups

- `Steel Beams`: queue a reinforced tile; if it clears in a word, its row gets fortified and pressure drops sharply
- `Wrecking Ball`: blasts through a column to create breathing room
- `Mortar`: turns the next tile into a wildcard

Power-ups cost Ink and live in a 3-slot inventory.

## Game Systems

- `Entity-driven board state`
  Every tile is stored as an RTK entity object instead of mutating a 2D string matrix.
- `Custom tick loop`
  Falling motion is driven by a discrete game tick, not a physics engine.
- `Word scanning`
  The board scans for horizontal and vertical words after each lock and after gravity resolves.
- `Cascades`
  Cleared letters disappear, unsupported letters fall, and combo chains can happen naturally.
- `Pressure HUD`
  Locked tiles raise pressure over time, and higher pressure speeds up the tick rate.
- `Fun-first assist tuning`
  After the guided opener, the game biases upcoming letters toward easier, more solvable word opportunities.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Redux Toolkit
- React Redux
- Vitest
- Testing Library

## Project Structure

- `src/app`
  Redux store and typed hooks
- `src/features`
  RTK slices, selectors, and gameplay thunks
- `src/game`
  Pure gameplay utilities, constants, word scanning, assist tuning, and pressure logic
- `src/components`
  Board, HUD panels, and pressure chart
- `src/hooks`
  Tick loop, keyboard controls, touch controls, and audio hooks
- `src/data`
  Dictionary and curated assist word data
- `src/test`
  Unit and integration coverage

## Run It Locally

Install dependencies:

```bash
npm install
```

Start the game:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Run lint:

```bash
npm run lint
```

Build production output:

```bash
npm run build
```

## Testing Coverage

The current suite covers:

- word detection in both directions
- wildcard resolution
- movement and collision rules
- gravity and cascades
- pressure scaling
- guided opening and objective flow
- power-up behavior
- touch controls

## Current Phase

The project is past the first playable milestone and is now in a **fun-first tuning phase**.

What is already in place:

- playable falling-letter game loop
- RTK entity-based board state
- word clears, gravity, and cascades
- pressure chart and game-over pressure cap
- Ink economy and 3 power-ups
- guided opening and live objective system
- touch controls and GitHub Pages deployment
- dictionary rebuild for better recognition of common short words

What we are actively tuning right now:

- broader dictionary coverage for obvious English words
- better balance so the game feels generous, not stingy
- clearer word trust, so obvious words consistently count
- early-game pacing and spawn quality

## What We Plan Next

Near-term roadmap:

1. Expand the accepted dictionary so more short, medium, and eventually larger English words are recognized reliably.
2. Improve spawn tuning so the board produces more satisfying word opportunities and fewer dead runs.
3. Add stronger visual feedback for clears, combos, and valid-word recognition.
4. Polish the game-over and restart loop so a failed run still feels rewarding.
5. Improve mobile feel and responsive ergonomics further without sacrificing board readability.

Later roadmap:

1. Richer audio and animation polish
2. More deliberate progression and difficulty scaling
3. Broader dictionary tooling and import pipeline for larger English vocab coverage
4. More content depth around objectives, runs, and replayability

## Deployment

This repo deploys to GitHub Pages through GitHub Actions.

- Workflow: `.github/workflows/deploy-pages.yml`
- Production URL: [https://stonedhawk.github.io/DropQuote-Architect/](https://stonedhawk.github.io/DropQuote-Architect/)

## Notes

- The game intentionally uses a custom tick loop and RTK entity state instead of a physics engine.
- Dictionary data is layered so gameplay-friendly assist words and broader accepted words can evolve separately.
- This repo is still actively tuned for feel, so gameplay balance is expected to keep improving.
