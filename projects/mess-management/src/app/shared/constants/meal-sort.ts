/**
 * Meal slot sorting utility with 3am pivot.
 *
 * The mess system resets at 3am (taps purged, new day starts).
 * Meals before 3am (e.g. Midnight Snack, Late Night) are "end of day"
 * and sort after all other meals.
 *
 * Pivot = 180 minutes from midnight (3:00 AM).
 */

const PIVOT_MINUTES = 180; // 3:00 AM

/** Typical start times (minutes from midnight) for each meal slot. */
const MEAL_NAME_TO_MINUTES: Record<string, number> = {
  'early breakfast': 300,   // 5:00 AM
  'breakfast': 450,         // 7:30 AM
  'brunch': 600,            // 10:00 AM
  'tea': 690,               // 11:30 AM
  'lunch': 750,             // 12:30 PM
  'snacks': 660,            // 11:00 AM
  'dinner': 1140,           // 7:00 PM
  'late night': 1380,       // 11:00 PM
  'midnight snack': 90,     // 1:30 AM
};

/** Convert a 24h time string "HH:MM" to minutes from midnight. */
export function timeToMinutes(time24: string): number {
  if (!time24) return 0;
  const parts = time24.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
}

/** Convert a meal name (e.g. "Breakfast", "LUNCH") to minutes from midnight. */
export function mealNameToMinutes(name: string): number {
  return MEAL_NAME_TO_MINUTES[name.toLowerCase()] ?? 0;
}

/**
 * Compare two start times (minutes from midnight) with 3am pivot.
 * Returns negative if a should come before b, positive if after, 0 if equal.
 *
 * Meals >= 3am: sorted ascending (early morning → evening)
 * Meals < 3am:  sorted ascending but always after all >= 3am meals
 */
export function compareMealStartTimes(aMinutes: number, bMinutes: number): number {
  const aBeforePivot = aMinutes < PIVOT_MINUTES;
  const bBeforePivot = bMinutes < PIVOT_MINUTES;

  if (aBeforePivot && !bBeforePivot) return 1;  // a is after-midnight, b is before → b first
  if (!aBeforePivot && bBeforePivot) return -1;  // a is before-midnight, b is after → a first
  return aMinutes - bMinutes; // both in same group → sort by time
}

/**
 * Sort an array of objects with startTime (minutes) in place using 3am pivot.
 * Returns the sorted array for chaining.
 */
export function sortByMealTime<T>(items: T[], getMinutes: (item: T) => number): T[] {
  return items.sort((a, b) => compareMealStartTimes(getMinutes(a), getMinutes(b)));
}
