import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TabsModule } from '@libs/tabs';
import { ButtonComponent, EmptyStateComponent } from '@libs/shared-ui';
import { TableModule } from '@libs/table';
import { ReportsService } from '../../services/reports.service';
import { StudentOverview, AttendanceDay, ChangelogEntry } from '../../models/reports.models';
import type { TableColumn } from '@libs/table';

// ── Interfaces ──────────────────────────────────────────────────────────────────

interface HeatmapCell {
  dateStr: string;
  day: number;
  month: number;
  year: number;
  overall?: string;
  count?: number;
  total?: number;
}

type WeekRow = (HeatmapCell | null)[];

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
  tapsDuringPause: number;
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
  'present': '#216E39',
  'partial': '#9BE9A8',
  'absent': '#EBEDF0',
  'holiday': '#93C5FD',
  'paused': '#FCD34D',
};

const ACTION_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  SUBSCRIPTION_CREATED:   { bg: '#DCFCE7', text: '#1D9F00', icon: 'plus' },
  SUBSCRIPTION_RENEWED:   { bg: '#DCFCE7', text: '#1D9F00', icon: 'refresh' },
  SUBSCRIPTION_MODIFIED:  { bg: '#DBEAFE', text: '#155DFC', icon: 'edit' },
  SUBSCRIPTION_DELETED:   { bg: '#FFF1F2', text: '#C70036', icon: 'trash' },
  PAUSE_STARTED:          { bg: '#FEF3C7', text: '#FE9A00', icon: 'pause' },
  PAUSE_ENDED:          { bg: '#DCFCE7', text: '#1D9F00', icon: 'play' },
  PAUSE_EXTENDED:         { bg: '#FEF3C7', text: '#FE9A00', icon: 'clock' },
  CARD_BLOCKED:           { bg: '#FFF1F2', text: '#C70036', icon: 'lock' },
  CARD_UNBLOCKED:         { bg: '#DCFCE7', text: '#1D9F00', icon: 'unlock' },
};

const ACTIVITY_COLORS: Record<string, { bg: string; text: string }> = {
  SUBSCRIPTION_CREATED:   { bg: '#DCFCE7', text: '#1D9F00' },
  SUBSCRIPTION_MODIFIED:  { bg: '#DBEAFE', text: '#155DFC' },
  SUBSCRIPTION_RENEWED:   { bg: '#DCFCE7', text: '#1D9F00' },
  SUBSCRIPTION_DELETED:   { bg: '#FFF1F2', text: '#C70036' },
  PAUSE_STARTED:          { bg: '#FEF3C7', text: '#FE9A00' },
  PAUSE_ENDED:          { bg: '#DCFCE7', text: '#1D9F00' },
  PAUSE_EXTENDED:         { bg: '#FEF3C7', text: '#FE9A00' },
  CARD_BLOCKED:           { bg: '#FFF1F2', text: '#C70036' },
  CARD_UNBLOCKED:         { bg: '#DCFCE7', text: '#1D9F00' },
};

// ── Component ───────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TabsModule, ButtonComponent, EmptyStateComponent, TableModule],
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
  ];
  activeTab = 'overview';

  // ── API data ────────────────────────────────────────────────────────────────
  overview: StudentOverview | null = null;
  attendanceData: AttendanceDay[] = [];
  changelogData: ChangelogEntry[] = [];
  subscriptionHistory: any[] = [];
  pauseCompData: any = null;

  // ── Loading states ──────────────────────────────────────────────────────────
  overviewLoading = false;
  attendanceLoading = false;
  changelogLoading = false;
  historyLoading = false;
  pauseLoading = false;
  activityFilterLoading = false;

  // ── Overview: Student Profile ──────────────────────────────────────────────
  // (uses overview property directly)

  // ── Overview: Weekly heatmap ───────────────────────────────────────────────
  weeklyHeatmapCells: (HeatmapCell | null)[] = [];
  selectedDayTap: DayTapDetail | null = null;

  // ── Overview: Recent activity ──────────────────────────────────────────────
  recentActivity: ActivityEntry[] = [];

  // ── Attendance: Heatmap ────────────────────────────────────────────────────
  heatmapView: 'yearly' | 'monthly' | 'weekly' = 'yearly';
  heatmapYear = new Date().getFullYear();
  heatmapMonth = new Date().getMonth();
  heatmapWeeks: WeekRow[] = [];
  heatmapMonthLabels: { col: number; label: string }[] = [];
  heatmapColWidth = 22;
  attendanceSummary: { present: number; partial: number; absent: number; holiday: number; paused: number } | null = null;

  // ── Activity & History ─────────────────────────────────────────────────────
  activityEntries: ActivityEntry[] = [];
  activityFilter: string | null = null;
  milestones: SubscriptionMilestone[] = [];
  pausePeriods: PausePeriodEntry[] = [];
  pauseSummary = { totalPeriods: 0, totalDaysPaused: 0, totalCompDays: 0 };

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
    this.weeklyHeatmapCells = [];
    this.selectedDayTap = null;
    this.heatmapWeeks = [];
    this.heatmapMonthLabels = [];
    this.attendanceSummary = null;
    this.activityEntries = [];
    this.milestones = [];
    this.pausePeriods = [];
    this.pauseSummary = { totalPeriods: 0, totalDaysPaused: 0, totalCompDays: 0 };
    this.browsingDay = null;
    this.activityFilter = null;
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
  }

  // ── Data loaders ───────────────────────────────────────────────────────────

  private loadOverview() {
    this.overviewLoading = true;
    this.reportsService.getStudentOverview(this.rollNumber).subscribe({
      next: data => {
        this.overview = data;
        this.overviewLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.overviewLoading = false; this.cdr.detectChanges(); }
    });
  }

  private loadAttendance(from?: string, to?: string) {
    this.attendanceLoading = true;
    this.reportsService.getStudentAttendance(this.rollNumber, from, to).subscribe({
      next: data => {
        this.attendanceData = data;
        this.attendanceLoading = false;
        this.buildWeeklyHeatmap();
        this.buildYearlyHeatmap();
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
      for (const meal of day.mealSlots) {
        if (meal.isHoliday || meal.isPaused) continue;
        totalExpected++;
        if (meal.tapped) totalTaps++;
      }
    }
    this.overview.attendanceRate = totalExpected > 0 ? Math.round(totalTaps / totalExpected * 100) : 0;
    this.overview.totalTaps = totalTaps;
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
        this.cdr.detectChanges();
      },
      error: () => { this.pauseLoading = false; this.cdr.detectChanges(); }
    });
  }

  // ── Heatmap builders ───────────────────────────────────────────────────────

  private buildWeeklyHeatmap() {
    const cells: (HeatmapCell | null)[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = this.toDateStr(d);
      const match = this.attendanceData.find(a => a.date === ds);
      cells.push(match ? {
        dateStr: ds,
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        overall: match.overall,
        count: match.mealSlots.filter(m => m.tapped).length,
        total: match.mealSlots.filter(m => !m.isHoliday).length,
      } : {
        dateStr: ds,
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
      });
    }
    this.weeklyHeatmapCells = cells;
  }

  private buildYearlyHeatmap() {
    const year = this.heatmapYear;
    const firstDay = new Date(year, 0, 1);
    const lastDay = new Date(year, 11, 31);

    const start = new Date(firstDay);
    start.setDate(start.getDate() - start.getDay()); // first Sunday on or before Jan 1

    const COL_WIDTH = 22; // cell (20px w-5) + gap-0.5 (2px)

    const weeks: WeekRow[] = [[], [], [], [], [], [], []];
    const monthLabels: { col: number; label: string }[] = [];

    let current = new Date(start);
    let col = 0;
    const seenMonths = new Set<number>();

    while (current <= lastDay || col % 7 !== 0) {
      for (let row = 0; row < 7; row++) {
        const cellDate = new Date(start);
        cellDate.setDate(start.getDate() + col * 7 + row);

        if (cellDate >= firstDay && cellDate <= lastDay) {
          const ds = this.toDateStr(cellDate);
          const match = this.attendanceData.find(a => a.date === ds);
          weeks[row].push(match ? {
            dateStr: ds,
            day: cellDate.getDate(),
            month: cellDate.getMonth(),
            year: cellDate.getFullYear(),
            overall: match.overall,
            count: match.mealSlots.filter(m => m.tapped).length,
            total: match.mealSlots.filter(m => !m.isHoliday).length,
          } : {
            dateStr: ds,
            day: cellDate.getDate(),
            month: cellDate.getMonth(),
            year: cellDate.getFullYear(),
          });

          if (cellDate.getDate() <= 7 && !seenMonths.has(cellDate.getMonth())) {
            seenMonths.add(cellDate.getMonth());
            monthLabels.push({ col, label: MONTH_LABELS[cellDate.getMonth()] });
          }
        } else {
          weeks[row].push(null);
        }
      }
      col++;
      if (current > lastDay && col % 7 === 0) break;
      current.setDate(current.getDate() + 7);
    }

    this.heatmapWeeks = weeks;
    this.heatmapMonthLabels = monthLabels;
    this.heatmapColWidth = COL_WIDTH;
  }

  private buildMonthlyHeatmap() {
    const year = this.heatmapYear;
    const month = this.heatmapMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const start = new Date(firstDay);
    start.setDate(start.getDate() - start.getDay());

    const weeks: WeekRow[] = [[], [], [], [], [], [], []];

    let current = new Date(start);
    let col = 0;

    while (current <= lastDay) {
      for (let row = 0; row < 7; row++) {
        const cellDate = new Date(start);
        cellDate.setDate(start.getDate() + col * 7 + row);

        if (cellDate >= firstDay && cellDate <= lastDay) {
          const ds = this.toDateStr(cellDate);
          const match = this.attendanceData.find(a => a.date === ds);
          weeks[row].push(match ? {
            dateStr: ds,
            day: cellDate.getDate(),
            month: cellDate.getMonth(),
            year: cellDate.getFullYear(),
            overall: match.overall,
          } : {
            dateStr: ds,
            day: cellDate.getDate(),
            month: cellDate.getMonth(),
            year: cellDate.getFullYear(),
          });
        } else {
          weeks[row].push(null);
        }
      }
      col++;
      current.setDate(current.getDate() + 7);
    }

    this.heatmapWeeks = weeks;
    this.heatmapMonthLabels = [];
  }

  private computeAttendanceSummary() {
    let present = 0, partial = 0, absent = 0, holiday = 0, paused = 0;
    for (const day of this.attendanceData) {
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
      if (event.action === 'PAUSE_STARTED' && event.details?.pauseStartDate && event.details?.pauseEndDate) {
        const start = event.details.pauseStartDate;
        const end = event.details.pauseEndDate;
        const now = Date.now();
        const isActive = now >= start && now <= end;
        const days = Math.max(1, Math.round((end - start) / 86400000));
        periods.push({
          pauseStart: start,
          pauseEnd: end,
          reason: event.reason || 'Paused',
          status: isActive ? 'active' : 'completed',
          compensatedDays: days,
          tapsDuringPause: 0,
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
            tapsDuringPause: 0,
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
  }

  // ── UI actions ─────────────────────────────────────────────────────────────

  onTabChange(tabId: string) {
    this.activeTab = tabId;
    if (tabId === 'attendance') {
      this.refreshHeatmap();
    }
  }

  onHeatmapViewChange(view: 'yearly' | 'monthly' | 'weekly') {
    this.heatmapView = view;
    this.refreshHeatmap();
  }

  onHeatmapYearChange(dir: number) {
    this.heatmapYear += dir;
    this.refreshHeatmap();
  }

  onHeatmapMonthChange(dir: number) {
    this.heatmapMonth += dir;
    if (this.heatmapMonth < 0) { this.heatmapMonth = 11; this.heatmapYear--; }
    if (this.heatmapMonth > 11) { this.heatmapMonth = 0; this.heatmapYear++; }
    this.refreshHeatmap();
  }

  private refreshHeatmap() {
    if (this.heatmapView === 'yearly') {
      this.buildYearlyHeatmap();
    } else if (this.heatmapView === 'monthly') {
      this.buildMonthlyHeatmap();
    }
    this.cdr.detectChanges();
  }

  onCellClick(cell: HeatmapCell | null) {
    if (!cell) return;
    const match = this.attendanceData.find(a => a.date === cell.dateStr);
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

  cellTitle(cell: HeatmapCell | null): string {
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
}
