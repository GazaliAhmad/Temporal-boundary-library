# Day Boundary Library

Assign timestamps to operational days when your day does not start at midnight.

For example, with a 09:00 boundary, an event at 00:30 belongs to the previous operational day, not the new calendar date.

This library gives you a consistent way to:
- resolve boundary windows
- group records by operational day
- handle fixed or date-shifting boundaries
- model DST-safe behavior with explicit time zones (v2)

Best for:
- shift and rota systems
- overnight operations
- payroll and reporting pipelines
- compliance and audit grouping logic

## Why this exists

Production systems still need deterministic day windows for grouping, reporting, and handover logic.

Common cases:

* shift-based work such as factories and logistics
* overnight operations like healthcare or transport
* systems where continuity matters more than calendar alignment

Keeping midnight as the boundary in these systems causes split records, broken aggregation, and scattered "previous day" logic.

This library centralizes that boundary logic so the rest of your application stays consistent.

## Core idea

Instead of asking what calendar date something belongs to, you define which window it belongs to.

A day is treated as a window:

[boundary_n, boundary_n+1)

Everything else is derived from that.

## Status

The project is v2-first.

Use the package root `day-boundary` for boundary resolution and `day-boundary/shifts` for companion shift helpers.

v2 is designed for explicit IANA time zones and correct DST handling.

## Installation

Install the package:

```bash
npm install day-boundary
```

The package already depends on `@js-temporal/polyfill`, so npm installs it automatically.

If application code also imports `Temporal` directly, the import is still:

```js
import { Temporal } from '@js-temporal/polyfill';
```

### Main import for new work

In Node, import the library from `day-boundary`.

If application code also uses `Temporal` directly:

```js
import { Temporal } from '@js-temporal/polyfill';
import { FixedTimeBoundaryStrategy } from 'day-boundary';
```

In browsers without a bundler, add an import map for the polyfill and its `jsbi` dependency before importing `./lib/day-boundary-v2.js`.

See [V2-USAGE.md](./V2-USAGE.md) for the full copy-paste setup.

## Concepts

A BoundaryStrategy defines how a day boundary is resolved.

Two implementations are provided:

* FixedTimeBoundaryStrategy for fixed daily boundaries
* DailyBoundaryStrategy for boundaries that change per date

For the explicit time-zone-aware v2 direction, see [V2-API.md](./V2-API.md) and [V2-USAGE.md](./V2-USAGE.md).

## Main Example: Fixed Boundary With v2

```js
import { Temporal } from '@js-temporal/polyfill';
import {
  FixedTimeBoundaryStrategy,
  getWindowForInstant,
} from 'day-boundary';

const strategy = new FixedTimeBoundaryStrategy({
  timeZone: 'Europe/London',
  boundaryTime: '09:00',
});

const window = getWindowForInstant(Temporal.Now.instant(), strategy);

console.log(window.start.toString());
console.log(window.end.toString());
```

## API

The main v2 surface is:

- `BoundaryStrategy`
- `FixedTimeBoundaryStrategy`
- `DailyBoundaryStrategy`
- `getWindowForInstant`
- `getWindowForZonedDateTime`
- `getWindowForPlainDateTime`
- `getWindowProgress`
- `isSameWindow`
- `groupByWindow`
- `getWindowId`

Use it via the package root:

```js
import {
  DailyBoundaryStrategy,
  FixedTimeBoundaryStrategy,
  getWindowForInstant,
} from 'day-boundary';
```

See:

- [V2-USAGE.md](./V2-USAGE.md) for v2 examples
- [V2-API.md](./V2-API.md) for the detailed v2 design spec

## Companion Shift Layer

A small companion layer now exists for shift-specific DST questions:

```js
import {
  getShiftEndByElapsedDuration,
  getShiftEndByWallClockDuration,
  compareShiftEndings,
} from 'day-boundary/shifts';
```

This layer is intentionally outside the core boundary engine.

It is for business rules such as:

- "sign off after 8 actual hours"
- "sign off at 08:00 local rota time"

Those can diverge on DST transition days.

## Shift Work and DST

For shift workers, healthcare, and hospital care, DST days introduce an important distinction:

- `elapsed-duration shift`: the worker signs off after a fixed amount of real elapsed time
- `wall-clock scheduled shift`: the worker signs off at the scheduled local clock time

These are not the same on DST transition days.

Example in London when clocks go back on Sunday, October 25, 2026:

- shift start: `00:00 BST`
- if the rule is `8 actual hours`, sign-off is `07:00 GMT`
- if the rule is `00:00 -> 08:00 local`, sign-off is `08:00 GMT`

So a nominal "8-hour shift" can mean:

- `8` real elapsed hours
- or `8` labeled local clock hours on the rota

The library's v2 direction is built so both interpretations can be modeled clearly:

- `Temporal.Instant` for exact elapsed-time rules
- `Temporal.ZonedDateTime` for local schedule rules

This matters in domains like:

- nurse and doctor shifts
- hospital handovers
- overnight care staffing
- security and transport shifts
- factory and logistics rosters

## Toy App

A simple example is included in:

`examples/day-boundary-toy-app/index.html`

It demonstrates:

* a fixed daily boundary at 09:00
* live window calculation
* grouping events across boundaries

Run locally:

```bash
python -m http.server 8000
```

Open:

[http://localhost:8000/examples/day-boundary-toy-app/](http://localhost:8000/examples/day-boundary-toy-app/)

## Dataset-backed Example

A browser example backed by real CSV data is included in:

`examples/day-boundary-hijri-poc/index.html`

It demonstrates:

- a shifting boundary loaded from a dataset
- navigation across resolved day windows
- date and timestamp lookup
- one real use case running on the v2 `Temporal`-based path

Run locally:

```bash
python -m http.server 8000
```

Open:

[http://localhost:8000/examples/day-boundary-hijri-poc/](http://localhost:8000/examples/day-boundary-hijri-poc/)

## DST Toy App

A browser example focused on region, DST, and day duration is included in:

`examples/day-boundary-dst-toy-app/index.html`

It demonstrates:

- explicit global location selection
- DST transitions in temperate zones
- near-polar and equatorial comparison points
- fixed boundary window duration inspection
- nearby day-duration comparison around zone changes

Open:

[http://localhost:8000/examples/day-boundary-dst-toy-app/](http://localhost:8000/examples/day-boundary-dst-toy-app/)

## Shift Toy App

A browser example focused on shift sign-off rules is included in:

`examples/day-boundary-shift-toy-app/index.html`

It demonstrates:

- exact elapsed-duration sign-off versus wall-clock scheduled sign-off
- fixed location selection across global regions
- preset DST-sensitive scenarios for London and New York
- a no-DST baseline for comparison
- why a shift can end at different local times depending on the rule

Open:

[http://localhost:8000/examples/day-boundary-shift-toy-app/](http://localhost:8000/examples/day-boundary-shift-toy-app/)

## Design constraints

* v2 is the main path and uses `Temporal` plus `@js-temporal/polyfill`
* Strategy-driven
* Pure computation functions

## Limitations

You must be able to resolve a boundary for any given date.

For shifting boundaries, this usually means providing:

* the previous day
* the current day
* the next day

If a boundary is missing, resolution fails by design.

For v2 specifically:

- you must provide explicit IANA time zones
- browser usage needs the Temporal polyfill setup until native support is broad enough
- calendar labeling still belongs outside the core library

## When to use this

Use it when:

* midnight breaks your logic
* events span across calendar days
* you need grouping based on operational cycles

Avoid it when:

* your system is strictly calendar-based
* midnight is already the correct boundary

## Summary

This is not a date utility.

It is a way to redefine what a day means, so the rest of your system does not have to.

## Legal

This project is copyright-owned by Gazali Ahmad, and The Right Business Pte Ltd is associated with the project by permission of the copyright owner. See [IP-NOTICE.md](./IP-NOTICE.md).
