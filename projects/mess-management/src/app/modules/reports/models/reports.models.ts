export interface TapRecord {
  id: string;
  rollNumber: string;
  mealSlot: string;
  tapTimestamp: string;
  date: string;
}

export interface AttendanceDay {
  date: string;
  mealSlots: {
    slotName: string;
    startTime: string;
    endTime: string;
    tapped: boolean;
    tapTime?: string;
    isHoliday: boolean;
    isPaused: boolean;
    isSubscriptionActive: boolean;
  }[];
  overall: 'present' | 'partial' | 'absent' | 'holiday' | 'paused';
}

export interface HolidayRecord {
  id: string;
  date: string;
  reason: string;
  createdAt?: string;
}

export interface ChangelogEntry {
  id: string;
  rollNumber: string;
  action: string;
  description: string;
  timestamp: string;
  changedBy?: string;
}

export interface PauseRecord {
  id: string;
  rollNumber: string;
  pauseStart: string;
  pauseEnd: string;
  reason: string;
  pausedAt: string;
  resumedAt?: string;
  status: 'active' | 'completed';
}

export interface StudentSubscriptionSummary {
  currentPlan: string;
  startDate: number;
  endDate: number;
  status: string;
  daysRemaining: number;
  totalDays: number;
  pausedDays: number;
  mealSlots: string[];
}

export interface StudentOverview {
  rollNumber: string;
  name: string;
  email?: string;
  cardStatus: string;
  dayPreference?: string;
  superUser?: boolean;
  subscription?: StudentSubscriptionSummary;
  totalTaps: number;
  attendanceRate: number;
}

export interface MealDistribution {
  slotName: string;
  tapCount: number;
  subscriberCount: number;
}

export interface DailyAnalytics {
  totalTaps: number;
  totalActiveSubscribers: number;
  expectedActiveToday: number;
  pausedCount: number;
  expiredCount: number;
  mealDistribution: MealDistribution[];
}

export interface PauseAuditEntry {
  rollNumber: string;
  pauseStart: string;
  pauseEnd: string;
  reason: string;
  tapsDuringPause: number;
  compensatedDays: number;
}

export interface AnomalyTap {
  id: string;
  rollNumber: string;
  studentName: string;
  mealSlot: string;
  tapTimestamp: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ReportsResponse<T> {
  statusCode: number;
  type: string;
  responseData: {
    data: T;
    message?: string[];
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}
