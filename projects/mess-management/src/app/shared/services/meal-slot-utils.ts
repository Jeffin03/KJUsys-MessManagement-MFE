export type MealSlotStatus = 'Closed' | 'Live' | 'Upcoming' | 'Inactive';

const IST_OFFSET_MS = 5.5 * 3_600_000;

function getCurrentISTDate(): Date {
  const now = new Date();
  return new Date(now.getTime() + IST_OFFSET_MS);
}

export function computeMealSlotStatus(
  start24: string,
  end24: string,
  active: boolean = true,
  now?: Date
): MealSlotStatus {
  if (!active) return 'Inactive';
  if (!start24 || !end24) return 'Upcoming';

  const target = now || getCurrentISTDate();
  const cur = target.getUTCHours() * 60 + target.getUTCMinutes();
  const [sH, sM] = start24.split(':').map(Number);
  const [eH, eM] = end24.split(':').map(Number);
  const start = sH * 60 + sM;
  let end = eH * 60 + eM;

  if (end < start) end += 24 * 60;
  const adjCur = cur < start ? cur + 24 * 60 : cur;

  if (adjCur > end) return 'Closed';
  if (adjCur >= start && adjCur <= end) return 'Live';
  return 'Upcoming';
}
