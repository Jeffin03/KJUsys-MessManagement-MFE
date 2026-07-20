export interface MealEntry {
  customer: string;
  roll_number: string;
  mealSlot: 'Breakfast' | 'Lunch' | 'Dinner';
  time: string;
  status: 'Allowed' | 'Not Subscribed';
}

export interface MealSlot {
  name: string;
  code: string;
  icon: string;
  status: 'Closed' | 'Live' | 'Upcoming' | 'Inactive';
  timeRange: string;
  total: number;
  hadMeal: number | null;
  thirdStat: number | null;
  thirdLabel: string;
  startTime?: string;
}

export interface HardwareDevice {
  deviceId: string;
  name: string;
  icon: string;
  status: 'Online' | 'Connected' | 'Low Paper' | 'Offline';
  lastSeenMs?: number;
}

export interface DashboardStat {
  label: string;
  value: number;
  icon: string;
  color: string;
}
