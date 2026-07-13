import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '@libs/shared-ui';
import { DashboardService, HolidayRecord } from '../../services/dashboard.service';

interface CalendarDay {
  date: Date | null;
  isCurrentMonth: boolean;
}

interface HolidayGroup {
  monthKey: string;
  label: string;
  holidays: HolidayRecord[];
}

@Component({
  selector: 'app-holiday-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  template: `
    <div class="flex flex-col gap-5">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-sm font-semibold text-[#111827]">Holiday Calendar</span>
          <span class="text-[10px] text-[#6B7280]">Manage mess closure dates</span>
        </div>
        <lib-button type="primary" label="Add Holiday" (onClick)="openAddForm()"></lib-button>
      </div>

      <!-- Calendar Card -->
      <div class="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]" style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

        <!-- Calendar Header -->
        <div class="flex items-center justify-between mb-4 px-2">
          <button (click)="prevMonth($event)" class="cal-nav-btn">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <span class="text-[13px] font-bold text-[#111827] tracking-[-0.01em]">{{ calendarViewDate | date:'MMMM yyyy' }}</span>
          <button (click)="nextMonth($event)" class="cal-nav-btn">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        <!-- Weekday Headers -->
        <div class="cal-grid">
          <div *ngFor="let day of weekdays" class="cal-weekday">{{ day }}</div>
        </div>

        <!-- Day Grid -->
        <div class="cal-grid">
          <div *ngFor="let item of calendarDays"
               (click)="selectDate(item.date, $event)"
               class="cal-day-cell"
               [class.cal-day-empty]="!item.date"
               [class.cal-selected]="isSelected(item.date)"
               [class.cal-today]="isToday(item.date) && !isSelected(item.date)"
               [class.cal-has-holiday]="hasHoliday(item.date) && !isSelected(item.date)">

            <!-- Range Background -->
            <div *ngIf="item.date && isRangeMiddle(item.date)" class="cal-range-bg cal-range-middle"></div>
            <div *ngIf="item.date && isRangeStart(item.date)" class="cal-range-bg cal-range-start"></div>
            <div *ngIf="item.date && isRangeEnd(item.date)" class="cal-range-bg cal-range-end"></div>

            <!-- Day Number Circle -->
            <div class="cal-day-number"
                 [class.cal-selected]="isSelected(item.date)"
                 [class.cal-today]="isToday(item.date) && !isSelected(item.date)"
                 [class.cal-has-holiday]="hasHoliday(item.date) && !isSelected(item.date)"
                 [class.cal-current-month]="item.isCurrentMonth"
                 [class.cal-other-month]="!item.isCurrentMonth">
              {{ item.date?.getDate() }}
            </div>


          </div>
        </div>

        <!-- Legend -->
        <div class="flex items-center gap-4 mt-4 px-2">
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded bg-[#FEE2E2] border border-[#EF4444]"></div>
            <span class="text-[10px] font-medium text-[#6B7280]">Holiday</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-2 h-2 rounded-full bg-[#155DFC]"></div>
            <span class="text-[10px] font-medium text-[#6B7280]">Today</span>
          </div>
        </div>
      </div>

      <!-- Add Holiday Form -->
      <div *ngIf="showAddForm"
           class="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] animate-in fade-in">
        <span class="text-xs font-semibold text-[#111827]">New Holiday</span>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-[10px] font-medium text-[#111827] mb-1">Date</label>
            <input type="date" lang="en-GB" [ngModel]="newHolidayDate" (ngModelChange)="newHolidayDate = $event"
              class="w-full h-[40px] px-3 text-xs border border-[#D1D5DB] rounded-[8px] bg-white focus:border-[#155DFC] focus:ring-1 focus:ring-[#155DFC] outline-none transition-colors" />
          </div>
          <div>
            <label class="block text-[10px] font-medium text-[#111827] mb-1">Reason</label>
            <input type="text" [(ngModel)]="newHolidayReason" placeholder="e.g. National Holiday"
              class="w-full h-[40px] px-3 text-xs border border-[#D1D5DB] rounded-[8px] bg-white focus:border-[#155DFC] focus:ring-1 focus:ring-[#155DFC] outline-none transition-colors" />
          </div>
        </div>
        <div class="flex justify-end gap-3">
          <lib-button type="secondary" label="Cancel" (onClick)="showAddForm = false"></lib-button>
          <lib-button type="primary" label="Save" (onClick)="saveHoliday()" [disabled]="!newHolidayDate || !newHolidayReason"></lib-button>
        </div>
      </div>

      <!-- Holidays Configured Container -->
      <div class="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div class="px-5 py-3 bg-[#F9FAFB] border-b border-[#E5E7EB]">
          <span class="text-xs font-semibold text-[#111827]">Holidays Configured</span>
        </div>
        <div class="overflow-y-auto max-h-[320px]">
          <!-- Month-Grouped Holiday Accordion -->
          <div *ngIf="!loading && groupedHolidays.length > 0" class="flex flex-col gap-2 p-4">
            <div *ngFor="let group of groupedHolidays"
                 class="border border-[#E5E7EB] rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <div (click)="toggleMonth(group.monthKey)"
                   class="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-[#F9FAFB] transition-colors select-none">
                <span class="text-xs font-semibold text-[#111827]">{{ group.label }} · {{ group.holidays.length }} Holiday{{ group.holidays.length > 1 ? 's' : '' }}</span>
                <svg [style.transform]="expandedMonths.has(group.monthKey) ? 'rotate(180deg)' : 'rotate(0deg)'"
                     class="w-4 h-4 text-[#6B7280] transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
              <div *ngIf="expandedMonths.has(group.monthKey)" class="divide-y divide-[#F3F4F6]">
                <div *ngFor="let holiday of group.holidays" class="flex rounded-lg border border-[#E5E7EB] overflow-hidden mx-4 my-1.5">
                  <div class="w-1 flex-shrink-0" style="background:#EF4444"></div>
                  <div class="flex items-center justify-between flex-1 px-3 py-2">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-medium text-[#6B7280] min-w-[60px]">{{ formatHolidayDate(holiday.date) }}</span>
                      <span class="text-xs font-medium text-[#111827]">{{ holiday.reason }}</span>
                    </div>
                    <button (click)="deleteHoliday(holiday.id); $event.stopPropagation()"
                        class="text-xs font-medium text-[#C70036] hover:text-red-700 transition-colors px-2 py-1 rounded hover:bg-red-50">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- No Holidays State -->
          <div *ngIf="!loading && groupedHolidays.length === 0" class="px-5 py-8 text-center">
            <div class="flex flex-col items-center gap-2">
              <svg width="24" height="24" fill="none" stroke="#D1D5DB" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span class="text-xs text-[#6B7280]">No holidays configured</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="text-xs text-[#6B7280] text-center py-4">Loading holidays...</div>

    </div>
  `,
  styles: [`
    :host {
      display: block;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .cal-nav-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      border: 1px solid #E5E7EB;
      background: white;
      color: #6B7280;
      transition: all 0.2s;
      cursor: pointer;
    }

    .cal-nav-btn:hover {
      background: #F3F4F6;
      color: #111827;
    }

    .cal-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      width: 100%;
    }

    .cal-weekday {
      text-align: center;
      font-size: 11px;
      font-weight: 600;
      color: #6B7280;
      padding: 0.75rem 0;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .cal-day-cell {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 3rem;
      width: 100%;
      cursor: pointer;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
    }

    .cal-day-cell.cal-day-empty {
      opacity: 0;
      pointer-events: none;
    }

    .cal-day-number {
      position: relative;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      font-size: 12px;
      font-weight: 600;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .cal-day-number.cal-current-month {
      color: #111827;
    }

    .cal-day-number.cal-other-month {
      color: #D1D5DB;
    }

    .cal-day-cell.cal-selected {
      background-color: #155DFC;
      color: white;
      box-shadow: 0 4px 12px rgba(21, 93, 252, 0.3);
    }

    .cal-day-number.cal-selected {
      color: white;
    }

    .cal-day-cell:not(.cal-selected):hover {
      background-color: #F3F4F6;
    }

    .cal-day-cell.cal-has-holiday:not(.cal-selected):hover {
      background-color: #FECACA;
    }

    .cal-day-cell.cal-today:not(.cal-selected) {
      border: 1.5px solid #155DFC;
    }

    .cal-day-number.cal-today:not(.cal-selected) {
      color: #155DFC;
    }

    .cal-day-cell.cal-has-holiday {
      background-color: #FEE2E2;
    }

    .cal-day-number.cal-has-holiday {
      color: #991B1B;
    }

    .cal-range-bg {
      position: absolute;
      top: 0.5rem;
      bottom: 0.5rem;
      background-color: #FEE2E2;
      z-index: 5;
    }

    .cal-range-bg.cal-range-middle {
      left: 0;
      right: 0;
    }

    .cal-range-bg.cal-range-start {
      left: 50%;
      right: 0;
      border-top-left-radius: 4px;
      border-bottom-left-radius: 4px;
    }

    .cal-range-bg.cal-range-end {
      left: 0;
      right: 50%;
      border-top-right-radius: 4px;
      border-bottom-right-radius: 4px;
    }

    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .animate-in {
      animation-duration: 200ms;
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
      animation-fill-mode: forwards;
    }

    .fade-in {
      animation-name: fade-in;
    }
  `]
})
export class HolidayCalendarComponent implements OnInit {
  holidays: HolidayRecord[] = [];
  holidayMap = new Map<string, HolidayRecord[]>();
  groupedHolidays: HolidayGroup[] = [];
  expandedMonths: Set<string> = new Set();
  loading = false;

  calendarViewDate: Date = new Date();
  selectedDate: Date | null = null;

  showAddForm = false;
  newHolidayDate = '';
  newHolidayReason = '';

  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadHolidays();
  }

  private loadHolidays() {
    this.loading = true;
    this.dashboardService.getHolidays().subscribe({
      next: data => {
        this.holidays = data;
        this.buildHolidayMap();
        this.buildGroupedHolidays();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private buildHolidayMap() {
    this.holidayMap.clear();
    for (const h of this.holidays) {
      const ts = typeof h.date === 'string' ? parseInt(h.date, 10) : h.date;
      if (!ts) continue;
      const d = new Date(ts);
      const key = this.dateKey(d);
      const list = this.holidayMap.get(key) || [];
      list.push(h);
      this.holidayMap.set(key, list);
    }
  }

  private buildGroupedHolidays() {
    const groups = new Map<string, { label: string; holidays: HolidayRecord[] }>();

    for (const h of this.holidays) {
      const ts = typeof h.date === 'string' ? parseInt(h.date, 10) : h.date;
      if (!ts) continue;
      const d = new Date(ts);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (!groups.has(monthKey)) {
        groups.set(monthKey, { label, holidays: [] });
      }
      groups.get(monthKey)!.holidays.push(h);
    }

    this.groupedHolidays = Array.from(groups.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([monthKey, data]) => ({ monthKey, ...data }));

    this.expandedMonths.clear();
    if (this.groupedHolidays.length > 0) {
      this.expandedMonths.add(this.groupedHolidays[0].monthKey);
    }
  }

  toggleMonth(monthKey: string) {
    if (this.expandedMonths.has(monthKey)) {
      this.expandedMonths.clear();
    } else {
      this.expandedMonths.clear();
      this.expandedMonths.add(monthKey);
    }
  }

  formatHolidayDate(dateVal: any): string {
    if (!dateVal) return '';
    const ts = typeof dateVal === 'string' ? parseInt(dateVal, 10) : dateVal;
    if (!ts) return dateVal;
    const d = new Date(ts);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  }

  private dateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private dateFromKey(key: string): Date {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  get calendarDays(): CalendarDay[] {
    const year = this.calendarViewDate.getFullYear();
    const month = this.calendarViewDate.getMonth();
    const days: CalendarDay[] = [];

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ date: null, isCurrentMonth: false });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }

    const remainingDays = (7 - (days.length % 7)) % 7;
    for (let i = 0; i < remainingDays; i++) {
      days.push({ date: null, isCurrentMonth: false });
    }

    return days;
  }

  prevMonth(event: Event) {
    event.stopPropagation();
    this.calendarViewDate = new Date(
      this.calendarViewDate.getFullYear(),
      this.calendarViewDate.getMonth() - 1,
      1
    );
    this.cdr.detectChanges();
  }

  nextMonth(event: Event) {
    event.stopPropagation();
    this.calendarViewDate = new Date(
      this.calendarViewDate.getFullYear(),
      this.calendarViewDate.getMonth() + 1,
      1
    );
    this.cdr.detectChanges();
  }

  hasHoliday(date: Date | null): boolean {
    if (!date) return false;
    return this.holidayMap.has(this.dateKey(date));
  }

  getHolidaysForDate(date: Date): HolidayRecord[] {
    return this.holidayMap.get(this.dateKey(date)) || [];
  }

  isSelected(date: Date | null): boolean {
    if (!date || !this.selectedDate) return false;
    return date.getTime() === this.selectedDate.getTime();
  }

  isToday(date: Date | null): boolean {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  isRangeStart(date: Date): boolean {
    if (!this.hasHoliday(date)) return false;
    const prev = new Date(date);
    prev.setDate(prev.getDate() - 1);
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    return !this.hasHoliday(prev) && this.hasHoliday(next);
  }

  isRangeMiddle(date: Date): boolean {
    if (!this.hasHoliday(date)) return false;
    const prev = new Date(date);
    prev.setDate(prev.getDate() - 1);
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    return this.hasHoliday(prev) && this.hasHoliday(next);
  }

  isRangeEnd(date: Date): boolean {
    if (!this.hasHoliday(date)) return false;
    const prev = new Date(date);
    prev.setDate(prev.getDate() - 1);
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    return this.hasHoliday(prev) && !this.hasHoliday(next);
  }

  selectDate(date: Date | null, event: Event) {
    event.stopPropagation();
    if (!date) return;
    this.selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (this.showAddForm) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      this.newHolidayDate = `${y}-${m}-${d}`;
    }
    this.cdr.detectChanges();
  }

  openAddForm() {
    this.showAddForm = true;
    if (this.selectedDate) {
      const y = this.selectedDate.getFullYear();
      const m = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(this.selectedDate.getDate()).padStart(2, '0');
      this.newHolidayDate = `${y}-${m}-${d}`;
    } else {
      this.newHolidayDate = '';
    }
    this.newHolidayReason = '';
    this.cdr.detectChanges();
  }

  saveHoliday() {
    if (!this.newHolidayDate || !this.newHolidayReason) return;
    const dateMillis = new Date(this.newHolidayDate).getTime();
    this.dashboardService.createHoliday(dateMillis, this.newHolidayReason).subscribe({
      next: () => {
        this.showAddForm = false;
        this.newHolidayDate = '';
        this.newHolidayReason = '';
        this.loadHolidays();
      },
      error: (err) => {
        console.error('Failed to create holiday', err);
      }
    });
  }

  deleteHoliday(id: string) {
    this.dashboardService.deleteHoliday(id).subscribe({
      next: () => this.loadHolidays(),
      error: () => {}
    });
  }
}
