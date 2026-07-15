import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SubTabsModule } from '@libs/sub-tabs';
import { ButtonComponent, EmptyStateComponent } from '@libs/shared-ui';
import { TableModule } from '@libs/table';
import { ReportsService } from '../../../reports/services/reports.service';
import { StudentOverview, AttendanceDay, ChangelogEntry } from '../../../reports/models/reports.models';
import type { TableColumn } from '@libs/table';
import { mealNameToMinutes, compareMealStartTimes } from '../../../../shared/constants/meal-sort';

// ── Interfaces ──────────────────────────────────────────────────────────────────

interface CalendarDay {
  dateStr: string;
  day: number;
  month: number;
  year: number;
  overall?: string;
  name?: string;
  meals: {
    slotName: string;
    tapped: boolean;
    tapTime?: string;
    isHoliday: boolean;
    isPaused: boolean;
  }[];
  tappedCount: number;
  totalMeals: number;
  isFuture?: boolean;
}

interface CalendarWeek {
  days: (CalendarDay | null)[];
}

interface MealSegmentData {
  key: string;
  label: string;
  count: number;
  percent: number;
  color: string;
  dashLength: string;
  dashOffset: number;
}

interface MealSummaryCard {
  slotName: string;
  total: number;
  color: string;
  segments: MealSegmentData[];
}

interface ActivityEntry {
  id: string;
  action: string;
  description: string;
  timestamp: number;
  timeAgo: string;
  previousValue?: any;
  newValue?: any;
  expanded: boolean;
}

interface SubscriptionMilestone {
  date: number;
  action: string;
  title: string;
  details: string;
}

interface PausePeriodEntry {
  pauseStart: number;
  pauseEnd: number;
  reason: string;
  status: string;
  compensatedDays: number;
  tapsDuringPause: number | null;
}

interface DayTapDetail {
  date: string;
  dateLabel: string;
  meals: {
    slotName: string;
    tapped: boolean;
    tapTime?: string;
    isHoliday: boolean;
    isPaused: boolean;
    isSubscriptionActive: boolean;
  }[];
}

// ── Constants ───────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const HEATMAP_COLORS: Record<string, string> = {
  'present': '#1D9F00',
  'partial': '#30A14E',
  'absent': '#EBEDF0',
  'holiday': '#EF4444',
  'paused': '#D97706',
  'not_applicable': '#F3F4F6',
};

const MEAL_SLOT_COLORS: Record<string, string> = {
  'Breakfast': '#155DFC',
  'Lunch': '#1D9F00',
  'Dinner': '#7C3AED',
  'Tea': '#EA580C',
  'Snacks': '#0891B2',
};

const ACTION_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  SUBSCRIPTION_CREATED:   { bg: '#DCFCE7', text: '#1D9F00', icon: 'plus' },
  SUBSCRIPTION_RENEWED:   { bg: '#DCFCE7', text: '#1D9F00', icon: 'refresh' },
  SUBSCRIPTION_MODIFIED:  { bg: '#DBEAFE', text: '#155DFC', icon: 'edit' },
  SUBSCRIPTION_DELETED:   { bg: '#FFF1F2', text: '#C70036', icon: 'trash' },
  PAUSE_STARTED:          { bg: '#FEF3C7', text: '#FE9A00', icon: 'pause' },
  PAUSE_ENDED:          { bg: '#DCFCE7', text: '#1D9F00', icon: 'play' },
  PAUSE_EXTENDED:         { bg: '#FEF3C7', text: '#FE9A00', icon: 'clock' },
};

const ACTIVITY_COLORS: Record<string, { bg: string; text: string }> = {
  SUBSCRIPTION_CREATED:   { bg: '#DCFCE7', text: '#1D9F00' },
  SUBSCRIPTION_MODIFIED:  { bg: '#DBEAFE', text: '#155DFC' },
  SUBSCRIPTION_RENEWED:   { bg: '#DCFCE7', text: '#1D9F00' },
  SUBSCRIPTION_DELETED:   { bg: '#FFF1F2', text: '#C70036' },
  PAUSE_STARTED:          { bg: '#FEF3C7', text: '#FE9A00' },
  PAUSE_ENDED:          { bg: '#DCFCE7', text: '#1D9F00' },
  PAUSE_EXTENDED:         { bg: '#FEF3C7', text: '#FE9A00' },
};

// ── Component ───────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SubTabsModule, ButtonComponent, EmptyStateComponent, TableModule],
  providers: [ReportsService],
  templateUrl: './student-detail.component.html',
})
export class StudentDetailComponent implements OnChanges {
  @Input() rollNumber = '';
  @Input() refreshTrigger = 0;
  @Output() back = new EventEmitter<void>();

  // ── Tab state ───────────────────────────────────────────────────────────────
  tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'activity-history', label: 'Activity & History' },
    { id: 'pause-comp', label: 'Pause & Comp' },
  ];
  activeTab = 'overview';

  // ── API data ────────────────────────────────────────────────────────────────
  overview: StudentOverview | null = null;
  dayPreference: string = 'all';
  attendanceData: AttendanceDay[] = [];
  changelogData: ChangelogEntry[] = [];
  subscriptionHistory: any[] = [];
  pauseCompData: any = null;

  // ── Loading states ──────────────────────────────────────────────────────────
  overviewLoading = false;
  studentNotFound = false;
  attendanceLoading = false;
  changelogLoading = false;
  historyLoading = false;
  pauseLoading = false;
  activityFilterLoading = false;

  // ── Overview: Student Profile ──────────────────────────────────────────────
  // (uses overview property directly)

  // ── Overview: Weekly attendance cards ──────────────────────────────────────
  weeklyDayCards: CalendarDay[] = [];
  selectedDayTap: DayTapDetail | null = null;

  // ── Overview: Recent activity ──────────────────────────────────────────────
  recentActivity: ActivityEntry[] = [];

  // ── Attendance: Calendar month grid ────────────────────────────────────────
  calendarYear = new Date().getFullYear();
  calendarMonth = new Date().getMonth();
  calendarWeeks: CalendarWeek[] = [];
  calendarDayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  attendanceSummary: { present: number; partial: number; absent: number; holiday: number; paused: number } | null = null;

  // ── Attendance: Meal summary (circle-pie cards) ──────────────────────────
  mealSummaryCards: MealSummaryCard[] = [];
  yearlyMealSummaryCards: MealSummaryCard[] = [];

  // ── Yearly Meal Events ────────────────────────────────────────────────────
  selectedMealEvent: { slotName: string; status: string; statusLabel: string; color: string } | null = null;
  mealEventDates: { date: string; day: string; dateLabel: string; reason?: string }[] = [];

  onSelectMealEvent(slotName: string, status: string, statusLabel: string, color: string) {
    this.selectedMealEvent = { slotName, status, statusLabel, color };
    this.computeMealEventDates();
  }

  private computeMealEventDates() {
    if (!this.selectedMealEvent) { this.mealEventDates = []; return; }
    const { slotName, status } = this.selectedMealEvent;
    const now = new Date();
    const results: { date: string; day: string; dateLabel: string; reason?: string }[] = [];

    for (const day of this.attendanceData) {
      if (new Date(day.date).getFullYear() !== now.getFullYear()) continue;
      if (!this.isApplicable(day.date)) continue;
      for (const meal of day.mealSlots) {
        if (meal.slotName !== slotName) continue;

        let mealStatus: string;
        let reason: string | undefined;
        if (meal.isHoliday) {
          mealStatus = 'holiday';
          reason = this.holidayMap.get(day.date) || undefined;
        } else if (meal.isPaused) {
          mealStatus = 'paused';
          const d = new Date(day.date).getTime();
          const match = this.pausePeriods.find(p => d >= p.pauseStart && d <= p.pauseEnd);
          reason = match?.reason || undefined;
        } else {
          mealStatus = meal.tapped ? 'present' : 'absent';
        }

        if (mealStatus === status) {
          const d = new Date(day.date);
          const dayLabel = DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1];
          results.push({
            date: day.date,
            day: dayLabel,
            dateLabel: `${dayLabel}, ${d.getDate()} ${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`,
            reason,
          });
        }
      }
    }
    this.mealEventDates = results;
  }

  // ── Activity & History ─────────────────────────────────────────────────────
  activityEntries: ActivityEntry[] = [];
  activityFilter: string | null = null;
  milestones: SubscriptionMilestone[] = [];
  pausePeriods: PausePeriodEntry[] = [];
  pauseSummary = { totalPeriods: 0, totalDaysPaused: 0, totalCompDays: 0 };
  holidayMap = new Map<string, string>();

  activityColumns: TableColumn[] = [
    { key: 'timestamp', label: 'TIME', sortable: true, minWidth: '140px' },
    { key: 'action', label: 'ACTION', type: 'badge', minWidth: '150px', colorMap: ACTIVITY_COLORS },
    { key: 'description', label: 'DESCRIPTION', minWidth: '250px' },
  ];

  historyColumns: TableColumn[] = [
    { key: 'timestamp', label: 'DATE', sortable: true, minWidth: '140px' },
    { key: 'action', label: 'EVENT', type: 'badge', minWidth: '160px', colorMap: ACTIVITY_COLORS },
    { key: 'description', label: 'DETAILS', minWidth: '300px' },
  ];

  // ── Browse state ───────────────────────────────────────────────────────────
  browsingDay: DayTapDetail | null = null;

  constructor(
    private reportsService: ReportsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['rollNumber'] && this.rollNumber) {
      this.activeTab = 'overview';
      this.resetAllData();
      this.loadAllData();
    } else if (changes['refreshTrigger'] && this.rollNumber) {
      this.loadAllData();
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  private resetAllData() {
    this.overview = null;
    this.attendanceData = [];
    this.changelogData = [];
    this.subscriptionHistory = [];
    this.pauseCompData = null;
    this.recentActivity = [];
    this.weeklyDayCards = [];
    this.selectedDayTap = null;
    this.calendarWeeks = [];
    this.attendanceSummary = null;
    this.activityEntries = [];
    this.milestones = [];
    this.pausePeriods = [];
    this.pauseSummary = { totalPeriods: 0, totalDaysPaused: 0, totalCompDays: 0 };
    this.browsingDay = null;
    this.activityFilter = null;
    this.mealSummaryCards = [];
    this.studentNotFound = false;
  }

  private loadAllData() {
    this.loadOverview();
    // Fetch attendance for past 6 months + future to cover all historic data
    const from = new Date();
    from.setMonth(from.getMonth() - 6);
    const to = new Date();
    to.setDate(to.getDate() + 1);
    this.loadAttendance(from.getTime().toString(), to.getTime().toString());
    this.loadChangelog();
    this.loadSubscriptionHistory();
    this.loadPauseComp();
    this.loadHolidays();
  }

  // ── Data loaders ───────────────────────────────────────────────────────────

  private loadOverview() {
    this.overviewLoading = true;
    this.studentNotFound = false;
    this.reportsService.getStudentOverview(this.rollNumber).subscribe({
      next: data => {
        this.overview = data;
        this.dayPreference = data?.dayPreference || 'all';
        this.overviewLoading = false;
        if (!data || !data.name) {
          this.studentNotFound = true;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.overviewLoading = false;
        this.studentNotFound = true;
        this.cdr.detectChanges();
      }
    });
  }

  private loadAttendance(from?: string, to?: string) {
    this.attendanceLoading = true;
    this.reportsService.getStudentAttendance(this.rollNumber, from, to).subscribe({
      next: data => {
        // Sort meal slots with 3am pivot for every day
        for (const day of data) {
          day.mealSlots.sort((a, b) => compareMealStartTimes(
            mealNameToMinutes(a.slotName), mealNameToMinutes(b.slotName)
          ));
        }
        this.attendanceData = data;
        this.attendanceLoading = false;
        this.buildWeeklyDayCards();
        this.buildMonthCalendar();
        this.buildMealSummary('weekly', this.mealSummaryCards);
        this.buildMealSummary('yearly', this.yearlyMealSummaryCards);
        this.computeAttendanceSummary();
        this.setDefaultSelectedDay();
        this.computeOverviewStats();
        this.cdr.detectChanges();
      },
      error: () => { this.attendanceLoading = false; this.cdr.detectChanges(); }
    });
  }

  private computeOverviewStats() {
    if (!this.overview) return;
    let totalTaps = 0;
    let totalExpected = 0;
    for (const day of this.attendanceData) {
      if (!this.isApplicable(day.date)) continue;
      for (const meal of day.mealSlots) {
        if (meal.isHoliday || meal.isPaused) continue;
        totalExpected++;
        if (meal.tapped) totalTaps++;
      }
    }
    this.overview.attendanceRate = totalExpected > 0 ? Math.round(totalTaps / totalExpected * 100) : 0;
    this.overview.totalTaps = totalTaps;
  }

  private isApplicable(dateStr: string): boolean {
    const pref = this.dayPreference;
    if (!pref || pref === 'all') return true;
    const d = new Date(dateStr);
    const day = d.getDay();
    if (pref === 'weekday') return day >= 1 && day <= 5;
    if (pref === 'weekend') return day === 0 || day === 6;
    return true;
  }

  private loadChangelog() {
    this.changelogLoading = true;
    this.reportsService.getStudentChangelog(this.rollNumber, 100).subscribe({
      next: data => {
        this.changelogData = data;
        this.changelogLoading = false;
        this.buildRecentActivity();
        this.buildActivityEntries();
        this.cdr.detectChanges();
      },
      error: () => { this.changelogLoading = false; this.cdr.detectChanges(); }
    });
  }

  private loadSubscriptionHistory() {
    this.historyLoading = true;
    this.reportsService.getStudentSubscriptionHistory(this.rollNumber).subscribe({
      next: data => {
        this.subscriptionHistory = data;
        this.historyLoading = false;
        this.buildMilestones();
        this.buildPausePeriods();
        this.cdr.detectChanges();
      },
      error: () => { this.historyLoading = false; this.cdr.detectChanges(); }
    });
  }

  private loadPauseComp() {
    this.pauseLoading = true;
    this.reportsService.getStudentPauseComp(this.rollNumber).subscribe({
      next: data => {
        this.pauseCompData = data;
        this.pauseLoading = false;
        this.mergePauseCompData();
        this.cdr.detectChanges();
      },
      error: () => { this.pauseLoading = false; this.cdr.detectChanges(); }
    });
  }

  private loadHolidays() {
    this.reportsService.getHolidays().subscribe({
      next: data => {
        this.holidayMap.clear();
        for (const h of data) {
          const ds = this.toDateStr(new Date(h.date));
          this.holidayMap.set(ds, h.reason);
        }
      },
    });
  }

  // ── Heatmap builders ───────────────────────────────────────────────────────

  private buildWeeklyDayCards() {
    const cards: CalendarDay[] = [];
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = this.toDateStr(d);
      const applicable = this.isApplicable(ds);
      const match = this.attendanceData.find(a => a.date === ds);
      const meals = match ? match.mealSlots.map(m => ({
        slotName: m.slotName,
        tapped: m.tapped,
        tapTime: m.tapTime,
        isHoliday: m.isHoliday,
        isPaused: m.isPaused,
      })) : [];
      const tappedCount = meals.filter(m => m.tapped).length;
      const totalMeals = meals.filter(m => !m.isHoliday).length;
      cards.push({
        dateStr: ds,
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        overall: applicable ? match?.overall : 'not_applicable',
        name: dayNames[d.getDay()],
        meals,
        tappedCount,
        totalMeals,
      });
    }
    this.weeklyDayCards = cards;
  }

  private buildMonthCalendar() {
    const year = this.calendarYear;
    const month = this.calendarMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    // Monday-based day index (Mon=0, Sun=6)
    const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const totalCells = Math.ceil((startPad + totalDays) / 7) * 7;

    const weeks: CalendarWeek[] = [];
    let currentWeek: (CalendarDay | null)[] = [];

    const today = new Date();
    const todayStr = this.toDateStr(today);

    for (let i = 0; i < totalCells; i++) {
      const cellDate = new Date(year, month, i - startPad + 1);

      if (i >= startPad && i < startPad + totalDays) {
        const ds = this.toDateStr(cellDate);
        const isFuture = ds > todayStr;
        const applicable = this.isApplicable(ds);
        const match = this.attendanceData.find(a => a.date === ds);
        const meals = match ? match.mealSlots.map(m => ({
          slotName: m.slotName,
          tapped: m.tapped,
          tapTime: m.tapTime,
          isHoliday: m.isHoliday,
          isPaused: m.isPaused,
        })) : [];
        currentWeek.push({
          dateStr: ds,
          day: cellDate.getDate(),
          month: cellDate.getMonth(),
          year: cellDate.getFullYear(),
          overall: applicable ? match?.overall : 'not_applicable',
          meals,
          tappedCount: meals.filter(m => m.tapped).length,
          totalMeals: meals.filter(m => !m.isHoliday).length,
          isFuture,
        });
      } else {
        currentWeek.push(null);
      }

      if (currentWeek.length === 7) {
        weeks.push({ days: currentWeek });
        currentWeek = [];
      }
    }

    this.calendarWeeks = weeks;
  }

  private computeAttendanceSummary() {
    let present = 0, partial = 0, absent = 0, holiday = 0, paused = 0;
    for (const day of this.attendanceData) {
      if (!this.isApplicable(day.date)) continue;
      switch (day.overall) {
        case 'present': present++; break;
        case 'partial': partial++; break;
        case 'absent': absent++; break;
        case 'holiday': holiday++; break;
        case 'paused': paused++; break;
      }
    }
    this.attendanceSummary = { present, partial, absent, holiday, paused };
  }

  private buildMealSummary(mode: 'weekly' | 'yearly', target: MealSummaryCard[]) {
    const STATUS_CONFIG = mode === 'yearly'
      ? [
          { key: 'present', label: 'Present', color: '#1D9F00' },
          { key: 'absent', label: 'Absent', color: '#D1D5DB' },
          { key: 'holiday', label: 'Holiday', color: '#EF4444' },
          { key: 'paused', label: 'Paused', color: '#D97706' },
        ]
      : [
          { key: 'present', label: 'Present', color: '#1D9F00' },
          { key: 'partial', label: 'Partial', color: '#30A14E' },
          { key: 'absent', label: 'Absent', color: '#D1D5DB' },
          { key: 'holiday', label: 'Holiday', color: '#EF4444' },
          { key: 'paused', label: 'Paused', color: '#D97706' },
        ];

    const now = new Date();
    const filterDay = (d: AttendanceDay) => {
      const date = new Date(d.date);
      if (mode === 'weekly') {
        const start = new Date(now);
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return date >= start && date <= end;
      }
      return date.getFullYear() === now.getFullYear();
    };

    const filtered = this.attendanceData.filter(d => filterDay(d) && this.isApplicable(d.date));
    const slotTotals = new Map<string, number>();
    const statusCounts = new Map<string, Map<string, number>>();

    for (const day of filtered) {
      for (const meal of day.mealSlots) {
        const slot = meal.slotName;
        slotTotals.set(slot, (slotTotals.get(slot) || 0) + 1);

        let status: string;
        if (meal.isHoliday) {
          status = 'holiday';
        } else if (meal.isPaused) {
          status = 'paused';
        } else if (mode === 'yearly') {
          status = meal.tapped ? 'present' : 'absent';
        } else if (!meal.tapped) {
          status = 'absent';
        } else if (day.overall === 'present') {
          status = 'present';
        } else {
          status = 'partial';
        }

        if (!statusCounts.has(slot)) statusCounts.set(slot, new Map());
        const counts = statusCounts.get(slot)!;
        counts.set(status, (counts.get(status) || 0) + 1);
      }
    }

    const C = 2 * Math.PI * 32;
    const colors = ['#155DFC', '#1D9F00', '#7C3AED', '#EA580C', '#0891B2'];
    let ci = 0;
    const cards: MealSummaryCard[] = [];

    for (const [slot, total] of slotTotals) {
      const counts = statusCounts.get(slot)!;
      let cumulativeOffset = 0;
      const segments: MealSegmentData[] = [];

      for (const cfg of STATUS_CONFIG) {
        const count = counts.get(cfg.key) || 0;
        if (count === 0) continue;

        const percent = total > 0 ? Math.round((count / total) * 100) : 0;
        const arcLength = (count / total) * C;

        segments.push({
          key: cfg.key,
          label: cfg.label,
          count,
          percent,
          color: cfg.color,
          dashLength: `${arcLength} ${C - arcLength}`,
          dashOffset: -cumulativeOffset,
        });

        cumulativeOffset += arcLength;
      }

      if (segments.length === 0) continue;

      cards.push({
        slotName: slot,
        total,
        color: MEAL_SLOT_COLORS[slot] || colors[ci++ % colors.length],
        segments,
      });
    }

    // Sort cards with 3am pivot
    cards.sort((a, b) => compareMealStartTimes(
      mealNameToMinutes(a.slotName), mealNameToMinutes(b.slotName)
    ));
    target.splice(0, target.length, ...cards);
  }

  private setDefaultSelectedDay() {
    const today = this.toDateStr(new Date());
    const match = this.attendanceData.find(a => a.date === today)
      || this.attendanceData[0];
    if (match) {
      this.selectedDayTap = this.toDayTapDetail(match);
      this.browsingDay = this.selectedDayTap;
    }
  }

  // ── Activity builders ──────────────────────────────────────────────────────

  private buildRecentActivity() {
    this.recentActivity = this.changelogData.slice(0, 10).map(e => ({
      id: e.id,
      action: e.action,
      description: e.description,
      timestamp: typeof e.timestamp === 'string' ? new Date(e.timestamp).getTime() : e.timestamp,
      timeAgo: this.timeAgo(typeof e.timestamp === 'string' ? new Date(e.timestamp).getTime() : e.timestamp),
      previousValue: (e as any).previousValue,
      newValue: (e as any).newValue,
      expanded: false,
    }));
  }

  private buildActivityEntries() {
    this.activityEntries = this.changelogData.map(e => ({
      id: e.id,
      action: e.action,
      description: e.description,
      timestamp: typeof e.timestamp === 'string' ? new Date(e.timestamp).getTime() : e.timestamp,
      timeAgo: this.formatTimestamp(typeof e.timestamp === 'string' ? new Date(e.timestamp).getTime() : e.timestamp),
      previousValue: (e as any).previousValue,
      newValue: (e as any).newValue,
      expanded: false,
    }));
  }

  private buildMilestones() {
    this.milestones = this.subscriptionHistory.map((e: any) => {
      let title = '';
      let details = '';
      const d = e.details || {};

      switch (e.action) {
        case 'CREATED':
          title = 'Subscription Created';
          details = `Plan: ${d.plan || 'N/A'} | ${d.durationDays || 0} days | ${this.fmtDate(d.startDate)} → ${this.fmtDate(d.endDate)}`;
          break;
        case 'RENEWED':
          title = 'Subscription Renewed';
          details = `${d.durationDays || 0} days | ${this.fmtDate(d.previousEndDate)} → ${this.fmtDate(d.newEndDate)}`;
          break;
        case 'MODIFIED':
          title = 'Subscription Modified';
          details = e.reason || 'Details updated';
          break;
        case 'PAUSE_STARTED':
        case 'PAUSE_REQUESTED':
        case 'PAUSE_AUTO_STARTED':
          title = 'Pause Started';
          details = `${e.reason || 'No reason'} | ${this.fmtDate(d.pauseStartDate)} → ${this.fmtDate(d.pauseEndDate)}`;
          break;
        case 'PAUSE_ENDED':
          title = 'Pause Resumed';
          details = e.reason || 'Subscription auto-resumed after pause period ended';
          break;
        case 'PAUSE_EXTENDED':
          title = 'Pause Extended';
          details = e.reason || 'Pause duration extended';
          break;
        case 'DELETED':
          title = 'Subscription Deleted';
          details = e.reason || '';
          break;
        default:
          title = e.action;
          details = e.reason || '';
      }

      return {
        date: e.timestamp || 0,
        action: e.action,
        title,
        details,
      };
    });
  }

  private buildPausePeriods() {
    const periods: PausePeriodEntry[] = [];
    for (const event of this.subscriptionHistory) {
      const d = event.details || {};
      if (d.pauseStartDate && d.pauseEndDate &&
        ['PAUSE_STARTED', 'PAUSE_REQUESTED', 'PAUSE_AUTO_STARTED'].includes(event.action)) {
        // Deduplicate: skip if same start/end already added
        const exists = periods.some(p => p.pauseStart === d.pauseStartDate && p.pauseEnd === d.pauseEndDate);
        if (exists) continue;
        const start = d.pauseStartDate;
        const end = d.pauseEndDate;
        const now = Date.now();
        const isActive = now >= start && now <= end;
        const days = Math.max(1, Math.round((end - start) / 86400000));
        periods.push({
          pauseStart: start,
          pauseEnd: end,
          reason: event.reason || 'Paused',
          status: isActive ? 'active' : 'completed',
          compensatedDays: days,
          tapsDuringPause: null,
        });
      }
    }

    // Also include current pause from student doc if not already in history
    if (this.overview?.subscription) {
      const sub = this.overview.subscription as any;
      if (sub.pauseStart_Date && sub.pauseEnd_Date) {
        const exists = periods.some(p => p.pauseStart === sub.pauseStart_Date && p.pauseEnd === sub.pauseEnd_Date);
        if (!exists) {
          const now = Date.now();
          const isActive = now >= sub.pauseStart_Date && now <= sub.pauseEnd_Date;
          const days = Math.max(1, Math.round((sub.pauseEnd_Date - sub.pauseStart_Date) / 86400000));
          periods.push({
            pauseStart: sub.pauseStart_Date,
            pauseEnd: sub.pauseEnd_Date,
            reason: 'Paused',
            status: isActive ? 'active' : 'completed',
            compensatedDays: days,
            tapsDuringPause: null,
          });
        }
      }
    }

    periods.sort((a, b) => b.pauseStart - a.pauseStart);
    this.pausePeriods = periods;

    this.pauseSummary = {
      totalPeriods: periods.length,
      totalDaysPaused: periods.reduce((s, p) => s + Math.round((p.pauseEnd - p.pauseStart) / 86400000), 0),
      totalCompDays: periods.reduce((s, p) => s + p.compensatedDays, 0),
    };
    this.mergePauseCompData();
  }

  private mergePauseCompData() {
    if (!this.pauseCompData || !this.pauseCompData.hasPause || this.pausePeriods.length === 0) return;
    
    // Match only on pauseStart to be resilient against pause extensions modifying the end date
    const match = this.pausePeriods.find(p => p.pauseStart === this.pauseCompData.pauseStart);
    if (match) {
      match.tapsDuringPause = this.pauseCompData.tapsDuringPause;
    }
  }

  // ── UI actions ─────────────────────────────────────────────────────────────

  onTabChange(tabId: string) {
    this.activeTab = tabId;
    if (tabId === 'attendance') {
      this.buildMonthCalendar();
      this.buildMealSummary('yearly', this.yearlyMealSummaryCards);
      this.cdr.detectChanges();
    }
  }

  onMonthChange(dir: number) {
    this.calendarMonth += dir;
    if (this.calendarMonth < 0) { this.calendarMonth = 11; this.calendarYear--; }
    if (this.calendarMonth > 11) { this.calendarMonth = 0; this.calendarYear++; }
    this.buildMonthCalendar();
    this.cdr.detectChanges();
  }

  onCellClick(day: CalendarDay | null) {
    if (!day || day.isFuture) return;
    const match = this.attendanceData.find(a => a.date === day.dateStr);
    if (match) {
      this.selectedDayTap = this.toDayTapDetail(match);
    }
  }

  onActivityFilterChip(action: string | null) {
    this.activityFilter = action;
  }

  get filteredActivityEntries(): ActivityEntry[] {
    if (!this.activityFilter) return this.activityEntries;
    return this.activityEntries.filter(e => e.action === this.activityFilter);
  }

  getFilteredActivityData(): any[] {
    const entries = this.filteredActivityEntries;
    return entries.map(e => ({
      timestamp: this.formatTimestamp(e.timestamp),
      action: e.action,
      description: e.description,
    }));
  }

  toggleActivityExpand(entry: ActivityEntry) {
    entry.expanded = !entry.expanded;
  }

  toggleActivityRowExpand(entry: ActivityEntry) {
    entry.expanded = !entry.expanded;
  }

  goBack() {
    this.back.emit();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  fmtDate(millis: any): string {
    if (!millis) return '--';
    const d = new Date(millis);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  fmtDateTime(millis: any): string {
    if (!millis) return '--';
    const d = new Date(millis);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  private formatTimestamp(ts: number): string {
    return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  private timeAgo(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return this.fmtDate(ts);
  }

  private toDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private toDayTapDetail(day: AttendanceDay): DayTapDetail {
    return {
      date: day.date,
      dateLabel: day.date ? this.fmtDate(new Date(day.date).getTime()) : '',
      meals: day.mealSlots.map(m => ({
        slotName: m.slotName,
        tapped: m.tapped,
        tapTime: m.tapTime,
        isHoliday: m.isHoliday,
        isPaused: m.isPaused,
        isSubscriptionActive: m.isSubscriptionActive,
      })),
    };
  }

  getHeatmapColor(overall?: string): string {
    return HEATMAP_COLORS[overall || 'absent'] || HEATMAP_COLORS['absent'];
  }

  actionColor(action: string): { bg: string; text: string; icon: string } {
    return ACTION_COLORS[action] || { bg: '#F3F4F6', text: '#6B7280', icon: 'circle' };
  }

  cellTitle(cell: CalendarDay | null): string {
    if (!cell) return '';
    return `${cell.dateStr}: ${cell.overall || 'no data'}`;
  }

  getMilestoneIcon(action: string): string {
    switch (action) {
      case 'CREATED': return 'plus';
      case 'RENEWED': return 'refresh';
      case 'MODIFIED': return 'edit';
      case 'PAUSE_STARTED': return 'pause';
      case 'PAUSE_ENDED': return 'play';
      case 'PAUSE_EXTENDED': return 'clock';
      case 'DELETED': return 'trash';
      default: return 'circle';
    }
  }

  milestoneColor(action: string): { bg: string; text: string; icon: string } {
    const shortToFull: Record<string, string> = {
      'CREATED': 'SUBSCRIPTION_CREATED',
      'RENEWED': 'SUBSCRIPTION_RENEWED',
      'MODIFIED': 'SUBSCRIPTION_MODIFIED',
      'PAUSE_STARTED': 'PAUSE_STARTED',
      'PAUSE_ENDED': 'PAUSE_ENDED',
      'PAUSE_EXTENDED': 'PAUSE_EXTENDED',
      'DELETED': 'SUBSCRIPTION_DELETED',
    };
    return this.actionColor(shortToFull[action] || action);
  }

  getMilestoneText(action: string): string {
    return ACTION_COLORS[action]?.text || '#6B7280';
  }

  statusColor(status: string): string {
    switch (status) {
      case 'active': return '#155DFC';
      case 'paused': return '#FE9A00';
      case 'expired': return '#C70036';
      case 'completed': return '#007A55';
      default: return '#6B7280';
    }
  }

  getDayAttendClass(overall?: string): string {
    if (!overall) return 'bg-[#EBEDF0]';
    switch (overall) {
      case 'present': return 'bg-[#216E39]';
      case 'partial': return 'bg-[#9BE9A8]';
      case 'absent': return 'bg-[#EBEDF0]';
      case 'holiday': return 'bg-[#BBDEFB]';
      case 'paused': return 'bg-[#FEF3C7]';
      case 'not_applicable': return 'bg-[#F3F4F6]';
      default: return 'bg-[#EBEDF0]';
    }
  }

  getSeverityColor(count: number, total: number): string {
    if (total === 0) return '#EBEDF0';
    const pct = count / total;
    if (pct === 1) return '#216E39';
    if (pct >= 0.75) return '#30A14E';
    if (pct >= 0.5) return '#40C463';
    if (pct >= 0.25) return '#9BE9A8';
    return '#EBEDF0';
  }

  pauseDurationDays(p: PausePeriodEntry): number {
    return Math.round((p.pauseEnd - p.pauseStart) / 86400000);
  }

  getActionLabel(action: string): string {
    return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  readonly dayLabels = DAY_LABELS;
  readonly monthLabels = MONTH_LABELS;
  readonly Math = Math;
}
