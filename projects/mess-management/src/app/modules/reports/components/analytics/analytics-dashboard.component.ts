import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePickerModule } from '@libs/date-picker';
import { ReportsService } from '../../services/reports.service';
import { DailyAnalytics } from '../../models/reports.models';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerModule],
  providers: [ReportsService],
  template: `
    <div class="flex flex-col gap-5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-sm font-semibold text-[#111827]">Analytics Dashboard</span>
          <span *ngIf="!dateRangeActive" class="text-[10px] text-[#6B7280]">Overall metrics — all time</span>
          <span *ngIf="dateRangeActive" class="text-[10px] text-[#6B7280]">Filtered by date range</span>
        </div>
        <lib-date-picker (dateRangeSelected)="onDateSelected($event)" (onClear)="onClear()"></lib-date-picker>
      </div>

      <div class="grid grid-cols-4 gap-4">
        <div class="flex flex-col rounded-xl bg-white border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.05)] px-4 pt-[22px] pb-[39px] h-[127px] box-border">
          <div class="flex items-center gap-2 mb-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#155DFC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <span class="text-xs font-medium text-[#6B7280]">Total Taps</span>
          </div>
          <span class="text-[36px] font-bold text-[#111827] leading-none tracking-[-0.19px]">{{ analytics?.totalTaps || 0 }}</span>
        </div>
        <div class="flex flex-col rounded-xl bg-white border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.05)] px-4 pt-[22px] pb-[39px] h-[127px] box-border">
          <div class="flex items-center gap-2 mb-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D9F00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span class="text-xs font-medium text-[#6B7280]">Active Subscribers</span>
          </div>
          <span class="text-[36px] font-bold text-[#111827] leading-none tracking-[-0.19px]">{{ analytics?.totalActiveSubscribers || 0 }}</span>
        </div>
        <div class="flex flex-col rounded-xl bg-white border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.05)] px-4 pt-[22px] pb-[39px] h-[127px] box-border">
          <div class="flex items-center gap-2 mb-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FE9A00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span class="text-xs font-medium text-[#6B7280]">Paused</span>
          </div>
          <span class="text-[36px] font-bold text-[#111827] leading-none tracking-[-0.19px]">{{ analytics?.pausedCount || 0 }}</span>
        </div>
        <div class="flex flex-col rounded-xl bg-white border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.05)] px-4 pt-[22px] pb-[39px] h-[127px] box-border">
          <div class="flex items-center gap-2 mb-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C70036" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span class="text-xs font-medium text-[#6B7280]">Expired</span>
          </div>
          <span class="text-[36px] font-bold text-[#111827] leading-none tracking-[-0.19px]">{{ analytics?.expiredCount || 0 }}</span>
        </div>
      </div>

      <div class="flex flex-col bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <span class="text-sm font-semibold text-[#111827]">Meal-wise Distribution</span>
        </div>
        <div class="p-6">
          <div *ngIf="analytics?.mealDistribution?.length" class="space-y-4">
            <div *ngFor="let meal of analytics!.mealDistribution" class="flex items-center gap-4">
              <span class="text-xs font-medium w-24 text-[#111827]">{{ meal.slotName }}</span>
              <div class="flex-1 bg-[#F3F4F6] rounded-full h-2 overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500"
                  [style.width.%]="(meal.tapCount / (meal.subscriberCount || 1)) * 100"
                  [class.bg-[#155DFC]]="meal.tapCount <= meal.subscriberCount"
                  [class.bg-[#C70036]]="meal.tapCount > meal.subscriberCount">
                </div>
              </div>
              <span class="text-xs text-[#6B7280] w-32 text-right">{{ meal.tapCount }} taps / {{ meal.subscriberCount }} subs</span>
            </div>
          </div>
          <div *ngIf="!analytics?.mealDistribution?.length" class="text-xs text-[#6B7280] text-center py-6">
            No meal distribution data available.
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="text-xs text-[#6B7280] text-center py-4">Loading analytics...</div>
    </div>
  `
})
export class AnalyticsDashboardComponent implements OnInit {
  analytics: DailyAnalytics | null = null;
  loading = false;
  dateRangeActive = false;

  constructor(
    private reportsService: ReportsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadAnalytics();
  }

  private loadAnalytics(from?: string, to?: string) {
    this.loading = true;
    this.reportsService.getAnalyticsDashboard(from, to).subscribe({
      next: data => { this.analytics = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  onDateSelected(range: { from: Date; to: Date | null }) {
    const fromMs = range.from.getTime().toString();
    const toMs = (range.to ? range.to.getTime() : range.from.getTime() + 86400000).toString();
    this.dateRangeActive = true;
    this.loadAnalytics(fromMs, toMs);
  }

  onClear() {
    this.dateRangeActive = false;
    this.loadAnalytics();
  }
}
