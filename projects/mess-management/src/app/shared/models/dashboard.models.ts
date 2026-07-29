export interface MealEntry {
  customer: string;
  admission_number: string;
  mealSlot: 'Breakfast' | 'Lunch' | 'Dinner';
  time: string;
  status: 'Allowed' | 'Not Subscribed' | 'Super User';
  isSuperUser?: boolean;
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
  endTime?: string;
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
