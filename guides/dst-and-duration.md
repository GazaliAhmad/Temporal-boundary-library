# DST and duration semantics

This guide explains the most important behavior to keep in mind when using
`day-boundary` across DST transitions and other offset changes.

Related guides:

- [Usage](./usage.md) for practical examples
- [API](./api.md) for the full contract
- [SQL DST-Safe Queries](./sql-dst-safe-queries.md) for query patterns built on resolved windows

## Core rule

The window APIs resolve boundaries correctly across DST transitions.

That means the duration between one boundary and the next is not always `24`
hours. Depending on the local transition, a window may be `23`, `24`, or `25`
hours long.

## Two different meanings of duration

Keep these meanings separate:

- `elapsed duration`: exact real time passed
- `wall-clock duration`: local schedule labels on the clock

These are often the same on ordinary days and can differ on DST transition
days.

## Example

In `Europe/London`, when clocks go back:

- start at `00:00 BST`
- add `8 actual elapsed hours` -> `07:00 GMT`
- add `00:00 -> 08:00 local wall-clock time` -> `08:00 GMT`

Both rules can be valid. They just answer different business questions.

## Helpers

Use these root exports when you need to derive an end from a window start:

- `getWindowEndByElapsedDuration`
- `getWindowEndByWallClockDuration`
- `compareWindowEndings`

Example:

```js
import { Temporal } from '@js-temporal/polyfill';
import { compareWindowEndings } from 'day-boundary';

const start = Temporal.ZonedDateTime.from(
  '2026-10-25T00:00:00+01:00[Europe/London]'
);

const result = compareWindowEndings(start, Temporal.Duration.from({ hours: 8 }));

console.log(result.elapsedEnd.toString());   // 2026-10-25T07:00:00+00:00[Europe/London]
console.log(result.wallClockEnd.toString()); // 2026-10-25T08:00:00+00:00[Europe/London]
```

## How to choose

Use elapsed duration when the rule is about actual time passed, such as:

- SLA timers
- machine runtime
- exact overtime thresholds

Use wall-clock duration when the rule is about local scheduled clock labels,
such as:

- store opening hours
- lesson blocks
- timetable-based service windows

## Practical guidance

- Resolve the containing window first.
- Store and query with the resolved `[start, end)` range.
- Do not rebuild windows with assumptions like `midnight + 24 hours`.
- Keep business labels like late, absent, overrun, or overtime in your app layer.

For the detailed API behavior, examples, and migration notes, continue with
[Usage](./usage.md) and [API](./api.md).
