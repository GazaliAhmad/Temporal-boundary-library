# v3 migration guide

This guide covers the most common upgrades to the current `3.x` API exported
from `day-boundary`.

Related guides:

- [Usage](./usage.md) for the current recommended path
- [API](./api.md) for the full migration and validation rules
- [Functions Reference](./functions-reference.md) for the current export list

## What changed

The `3.x` line removes the former `day-boundary/shifts` companion API.
Boundary-window duration behavior now lives in the root package with neutral
names:

- `getWindowEndByElapsedDuration`
- `getWindowEndByWallClockDuration`
- `compareWindowEndings`

Shift, attendance, overtime, delivery, and SLA labels are application policy
decisions layered above the core boundary-window primitive.

## Common upgrades

- `new FixedTimeBoundaryStrategy({ startHour: 9, startMinute: 0 })` -> `new FixedTimeBoundaryStrategy({ timeZone: 'Asia/Singapore', boundaryTime: '09:00' })`
- `new FixedTimeBoundaryStrategy({ hour: 6, minute: 0, second: 0 })` -> `new FixedTimeBoundaryStrategy({ timeZone: 'Asia/Singapore', boundaryTime: '06:00' })`
- `new DailyBoundaryStrategy({ getBoundaryForDate(...) { ... } })` -> `new DailyBoundaryStrategy({ timeZone: 'Asia/Singapore', getBoundaryForDate(date, context) { ... } })`
- `getBoundaryForDate(...)` returning `Date`, string, or number -> return `Temporal.ZonedDateTime`
- `getWindowForInstant(dateOrString, strategy)` -> convert to `Temporal.Instant` first
- `getWindowForPlainDateTime('2026-10-25T01:30:00', strategy)` -> `getWindowForPlainDateTime(Temporal.PlainDateTime.from('2026-10-25T01:30:00'), strategy)`

## Runtime guards

The current runtime fails fast for the most common legacy inputs and points to
the intended `3.x` replacement instead of surfacing a generic validation error.

Typical guarded cases include:

- legacy fixed-time option keys
- missing `timeZone` on daily boundary strategies
- legacy `Date`, string, and numeric timestamp inputs
- plain-date-time helpers receiving non-Temporal inputs

## Recommended migration path

1. Move all external inputs into Temporal types at your app boundary.
2. Add explicit IANA `timeZone` values to every strategy.
3. Replace legacy shift-specific helper names with the root duration helpers.
4. Re-test DST transition scenarios with exact expected outputs.

For the detailed API contract and all validation behavior, see
[API](./api.md).
