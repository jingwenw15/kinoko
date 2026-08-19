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
- `r`: reset current focus session
- `q`: quit

## Data

V1 is local and mock-first. State is stored in:

```txt
data/kinoko.json
```

The file contains tasks, focus totals, mock weather, and the pocket note.

## Checks

```sh
npm run build
npm test
npm audit
```
