# kinoko

A cozy terminal desktop for your day.

Kinoko is an interactive terminal app that shows a small daily dashboard:

- current date and time
- local tasks
- focus timer
- mock weather
- pocket note
- mushroom desk styling

## Concept

```txt
╭──────────────────────────── kinoko ────────────────────────────╮
│  🍄 wed aug 19                         2:14 PM       ☁ 68°F    │
├───────────────────────┬─────────────────────┬─────────────────┤
│ today                 │ focus               │ little weather   │
│  ○ write outline      │  38 min             │  cloudy, calm    │
│  ● email sam          │  ███████░░░         │  mock data v1    │
│  ○ buy tea            │  [space] start      │                 │
├───────────────────────┴─────────────────────┴─────────────────┤
│ note: keep it small. one clear thing at a time.                 │
│ tab switch · ↑↓ move · enter done · space focus · r reset · q   │
╰──────────────────────────────────────────────────────────────────╯
```

## Run

```sh
npm install
npm run dev
```

Build and run the compiled app:

```sh
npm run build
npm start
```

## Controls

- `tab`: switch active panel
- `↑` / `↓`: move through tasks
- `enter`: toggle selected task
- `space`: start or pause focus timer
- `l`: set weather location by name
- `r`: reset current focus session
- `q`: quit

## Data

V1 is local and mock-first. State is stored in:

```txt
data/kinoko.json
```

The file contains tasks, focus totals, mock weather, and the pocket note.
Tasks, focus, and notes are stored under daily records keyed by `YYYY-MM-DD`, so a new day gets a separate dashboard instead of overwriting yesterday.

Weather config is stored in:

```txt
data/config.json
```

Kinoko uses Open-Meteo for weather. It does not require an API key. Weather is cached for 30 minutes and falls back to cached data if refresh fails.

## CLI commands

```sh
npm run build
node dist/cli.js list
node dist/cli.js add "review notes"
node dist/cli.js done 1
node dist/cli.js edit 1 "review project notes"
node dist/cli.js delete 1
node dist/cli.js note "keep it small"
node dist/cli.js weather set-location "San Francisco"
node dist/cli.js weather set-location "San Francisco" 37.7749 -122.4194
node dist/cli.js weather refresh
node dist/cli.js weather config
```

When installed as a package, the same commands are available through `kinoko`.

## Checks

```sh
npm run build
npm test
npm audit
```
