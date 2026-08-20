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

Local runtime files are created under `.kinoko/`, which is ignored by git.

## Controls

- `tab`: switch active panel
- `?`: open or close help
- `↑` / `↓`: move through tasks
- `enter`: toggle selected task
- `space`: start or pause focus timer
- `b`: start a break
- `f`: configure default focus minutes
- `g`: configure default break minutes
- `l`: set weather location by name
- `n`: edit pocket note
- `t`: cycle theme
- `r`: reset current focus session
- `q`: quit

## Data

Runtime state is local and ignored by git. By default, Kinoko writes:

```txt
.kinoko/kinoko.json
.kinoko/config.json
```

Set `KINOKO_HOME=/some/path` to use a different state directory.

The state file contains tasks, focus totals, cached weather, and the pocket note.
Tasks, focus, and notes are stored under daily records keyed by `YYYY-MM-DD`, so a new day gets a separate dashboard instead of overwriting yesterday.

Tracked example files live in:

```txt
examples/kinoko.example.json
examples/config.example.json
```

Kinoko uses Open-Meteo for weather. It does not require an API key. Weather is cached for 30 minutes and falls back to cached data if refresh fails.

Focus defaults are also stored in `.kinoko/config.json`:

- focus sessions: 25 minutes
- breaks: 5 minutes

Fresh installs start with `0` focus minutes used. Focus history is stored per day in `.kinoko/kinoko.json`. Resetting the current focus segment does not delete completed session history.

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
node dist/cli.js focus start
node dist/cli.js focus break
node dist/cli.js focus pause
node dist/cli.js focus resume
node dist/cli.js focus reset
node dist/cli.js focus status
node dist/cli.js config focus-minutes 45
node dist/cli.js config break-minutes 10
node dist/cli.js config theme pixel
node dist/cli.js import tasks ./todo.txt
```

When installed as a package, the same commands are available through `kinoko`.

For isolated testing:

```sh
KINOKO_HOME="$(mktemp -d)" node dist/cli.js add "scratch task"
```

## Checks

```sh
npm run build
npm test
npm audit
```
