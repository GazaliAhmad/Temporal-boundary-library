// Repository archive only. This file is not part of the published npm package surface.

import { Temporal } from "@js-temporal/polyfill";

export type ExactTime = Temporal.Instant | Temporal.ZonedDateTime;

export type BoundaryDisambiguation =
  | "compatible"
  | "earlier"
  | "later"
  | "reject";

export type BoundaryTimeInput = string | Temporal.PlainTime;

export interface DayBoundaryConfig {
  readonly timeZone: string;
}

export interface BoundaryWindow {
  readonly start: Temporal.ZonedDateTime;
  readonly end: Temporal.ZonedDateTime;
  readonly label: string;
  readonly metadata: Record<string, unknown>;
}

export interface FixedTimeBoundaryStrategyConfig extends DayBoundaryConfig {
  readonly boundaryTime?: BoundaryTimeInput;
  readonly label?: string;
  readonly disambiguation?: BoundaryDisambiguation;
  readonly hour?: never;
  readonly minute?: never;
  readonly second?: never;
  readonly millisecond?: never;
  readonly microsecond?: never;
  readonly nanosecond?: never;
  readonly startHour?: never;
  readonly startMinute?: never;
  readonly startSecond?: never;
}

export interface DailyBoundaryResolverContext {
  readonly timeZone: string;
  readonly disambiguation: BoundaryDisambiguation;
  readonly calendar: "iso8601";
}

export interface DailyBoundaryStrategyConfig extends DayBoundaryConfig {
  readonly label?: string;
  readonly disambiguation?: BoundaryDisambiguation;
  readonly getBoundaryForDate: (
    date: Temporal.PlainDate,
    context: DailyBoundaryResolverContext,
  ) => Temporal.ZonedDateTime;
}

export interface PlainDateTimeResolutionOptions {
  readonly timeZone?: string;
  readonly disambiguation?: BoundaryDisambiguation;
}

export interface BoundaryWindowIdentity {
  readonly start: Temporal.ZonedDateTime;
  readonly end: Temporal.ZonedDateTime;
}

export interface BoundaryWindowGroup<T> {
  readonly window: BoundaryWindow;
  readonly items: T[];
}

export interface BoundaryEndComparison {
  readonly elapsedEnd: Temporal.ZonedDateTime;
  readonly wallClockEnd: Temporal.ZonedDateTime;
  readonly sameInstant: boolean;
  readonly differenceMinutes: number;
}

export declare abstract class BoundaryStrategy {
  protected readonly __dayBoundaryBrand: symbol;
  readonly timeZone: string;

  protected constructor(options: DayBoundaryConfig);

  abstract getWindowForInstant(instant: ExactTime): BoundaryWindow;
}

export declare class FixedTimeBoundaryStrategy extends BoundaryStrategy {
  readonly boundaryTime: Temporal.PlainTime;
  readonly label: string;
  readonly disambiguation: BoundaryDisambiguation;

  constructor(options: FixedTimeBoundaryStrategyConfig);

  getBoundaryForDate(date: Temporal.PlainDate): Temporal.ZonedDateTime;

  getWindowForInstant(instant: ExactTime): BoundaryWindow;
}

export declare class DailyBoundaryStrategy extends BoundaryStrategy {
  readonly label: string;
  readonly disambiguation: BoundaryDisambiguation;

  constructor(options: DailyBoundaryStrategyConfig);

  getBoundaryForDate(date: Temporal.PlainDate): Temporal.ZonedDateTime;

  getWindowForInstant(instant: ExactTime): BoundaryWindow;
}

export declare function getWindowForInstant(
  instant: ExactTime,
  strategy: BoundaryStrategy,
): BoundaryWindow;

export declare function getWindowForZonedDateTime(
  zonedDateTime: Temporal.ZonedDateTime,
  strategy: BoundaryStrategy,
): BoundaryWindow;

export declare function getWindowForPlainDateTime(
  plainDateTime: Temporal.PlainDateTime,
  strategy: BoundaryStrategy,
  options?: PlainDateTimeResolutionOptions,
): BoundaryWindow;

export declare function getWindowProgress(
  instant: ExactTime,
  window: BoundaryWindowIdentity,
): number;

export declare function getWindowEndByElapsedDuration(
  start: Temporal.ZonedDateTime,
  duration: Temporal.Duration | Temporal.DurationLike,
): Temporal.ZonedDateTime;

export declare function getWindowEndByWallClockDuration(
  start: Temporal.ZonedDateTime,
  duration: Temporal.Duration | Temporal.DurationLike,
): Temporal.ZonedDateTime;

export declare function compareWindowEndings(
  start: Temporal.ZonedDateTime,
  duration: Temporal.Duration | Temporal.DurationLike,
): BoundaryEndComparison;

export declare function getWindowId(window: BoundaryWindowIdentity): string;

export declare function isSameWindow(
  a: ExactTime,
  b: ExactTime,
  strategy: BoundaryStrategy,
): boolean;

export declare function groupByWindow<T>(
  items: readonly T[],
  getInstant: (item: T) => ExactTime,
  strategy: BoundaryStrategy,
): BoundaryWindowGroup<T>[];
