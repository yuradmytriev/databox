import { DateTime } from "luxon";

export class DateManager {
  private static instance: DateManager;

  private constructor() {}

  static getInstance(): DateManager {
    if (!DateManager.instance) {
      DateManager.instance = new DateManager();
    }
    return DateManager.instance;
  }

  now(): Date {
    return DateTime.now().toJSDate();
  }

  nowSeconds(): number {
    return Math.floor(DateTime.now().toSeconds());
  }

  fromDate(date: Date): DateTime {
    return DateTime.fromJSDate(date);
  }

  fromISO(iso: string): DateTime {
    return DateTime.fromISO(iso);
  }

  fromSeconds(seconds: number): DateTime {
    return DateTime.fromSeconds(seconds);
  }

  format(date: Date, format: string): string {
    return DateTime.fromJSDate(date).toFormat(format);
  }

  isValid(date: Date): boolean {
    return DateTime.fromJSDate(date).isValid;
  }

  addDays(date: Date, days: number): Date {
    return DateTime.fromJSDate(date).plus({ days }).toJSDate();
  }

  addHours(date: Date, hours: number): Date {
    return DateTime.fromJSDate(date).plus({ hours }).toJSDate();
  }

  addMinutes(date: Date, minutes: number): Date {
    return DateTime.fromJSDate(date).plus({ minutes }).toJSDate();
  }

  subtractDays(date: Date, days: number): Date {
    return DateTime.fromJSDate(date).minus({ days }).toJSDate();
  }

  isBefore(date1: Date, date2: Date): boolean {
    return DateTime.fromJSDate(date1) < DateTime.fromJSDate(date2);
  }

  isAfter(date1: Date, date2: Date): boolean {
    return DateTime.fromJSDate(date1) > DateTime.fromJSDate(date2);
  }

  diff(
    date1: Date,
    date2: Date,
    unit: "days" | "hours" | "minutes" | "seconds" = "days",
  ): number {
    const dt1 = DateTime.fromJSDate(date1);
    const dt2 = DateTime.fromJSDate(date2);
    return dt1.diff(dt2, unit).get(unit);
  }

  toRelative(date: Date): string {
    const relative = DateTime.fromJSDate(date).toRelative() || "just now";
    const isInZeroSeconds = relative === "in 0 seconds";
    return isInZeroSeconds ? "in 1 second" : relative;
  }
}

export const dateManager = DateManager.getInstance();
