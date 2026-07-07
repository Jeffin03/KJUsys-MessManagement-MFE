import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { TableModule, TableColumn, PaginationConfig } from '@libs/table';
import { ButtonComponent } from '@libs/shared-ui';
import { SharedToastService } from '@libs/shared-toast';
import { ReportsService } from '../../services/reports.service';
import { DailyAnalytics, MealDistribution } from '../../models/reports.models';
import { DashboardService } from '../../../dashboard/services/dashboard.service';
import { MealEntry } from '../../../../shared/models/dashboard.models';

interface KpiCard {
  label: string;
  value: number;
  icon: string;
  color: string;
  accent: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

interface MealBar {
  name: string;
  served: number;
  total: number;
  percent: number;
  color: string;
}

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonComponent],
  providers: [ReportsService, DashboardService],
  template: `
    <div class="flex flex-col gap-5">

      <!-- KPI Row -->
      <div class="grid grid-cols-5 gap-4">
        <div *ngFor="let card of kpiCards"
          class="flex flex-col rounded-xl bg-white border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.05)] px-4 pt-[22px] pb-[39px] h-[127px] box-border">
          <div class="flex items-center gap-2">
            <span class="text-xs font-medium text-[#6B7280]">{{ card.label }}</span>
          </div>
          <p class="font-bold text-[36px] leading-none tracking-[-0.19px] mt-[9px]"
             [class.text-[#111827]]="!card.accent"
             [class.text-[#155DFC]]="card.accent === 'blue'"
             [class.text-[#007A55]]="card.accent === 'green'"
             [class.text-[#BB4D00]]="card.accent === 'orange'"
             [class.text-[#C70036]]="card.accent === 'red'"
             [class.text-[#7C3AED]]="card.accent === 'purple'">
            {{ card.value }}
          </p>
        </div>
      </div>

      <!-- Meal Utilization Bars + Export side -->
      <div class="flex gap-4">
        <div class="flex-1 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <span class="text-sm font-semibold text-[#111827] block mb-4">Today's Meal Utilization</span>
          <div *ngIf="mealBars.length > 0; else noMealData" class="space-y-4">
            <div *ngFor="let bar of mealBars">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-semibold text-[#111827]">{{ bar.name }}</span>
                <span class="text-[10px] font-medium text-[#6B7280]">{{ bar.served }} / {{ bar.total }} served ({{ bar.percent }}%)</span>
              </div>
              <div class="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500"
                  [style.width.%]="bar.percent"
                  [style.background-color]="bar.color">
                </div>
              </div>
            </div>
          </div>
          <ng-template #noMealData>
            <div class="text-xs text-[#6B7280] text-center py-6">No meal data available for today.</div>
          </ng-template>
        </div>

        <div class="w-[200px] bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center gap-3">
          <svg width="28" height="28" fill="none" stroke="#155DFC" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
          </svg>
          <span class="text-xs font-semibold text-[#111827] text-center">Export Report</span>
          <span class="text-[10px] text-[#6B7280] text-center leading-tight">Generate and download reports</span>
          <lib-button type="primary" label="Export" (onClick)="showExportModal = true"></lib-button>
        </div>
      </div>

      <!-- Live Taps Table -->
      <div class="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div class="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-[#111827]">Live Tap Activity</span>
            <span class="text-[10px] font-medium text-[#6B7280]">Today's transactions</span>
          </div>
        </div>
        <div class="p-6">
          <lib-table
            [columns]="tapColumns"
            [data]="tapData"
            [loading]="tapsLoading"
            [showToolbar]="true"
            [showSearch]="true"
            [stickyActions]="false"
            [clientPagination]="true"
            [pagination]="{ currentPage: 1, itemsPerPage: 20, totalItems: tapData.length, totalPages: Math.ceil(tapData.length / 20) }"
            [exportOptions]="exportOptions"
            (onExport)="onTableExport($event)"
          ></lib-table>
          <div *ngIf="!tapsLoading && tapData.length === 0" class="text-xs text-[#6B7280] text-center py-6">
            No taps recorded today.
          </div>
        </div>
      </div>

      <!-- Export Modal -->
      <div *ngIf="showExportModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
        (click)="showExportModal = false">
        <div class="bg-white rounded-2xl p-6 w-[480px] shadow-xl" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between mb-5">
            <span class="text-sm font-semibold text-[#111827]">Export Report</span>
            <button (click)="showExportModal = false" class="text-[#6B7280] hover:text-[#111827] transition-colors">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-[10px] font-medium text-[#111827] mb-1">Report Type</label>
              <select [(ngModel)]="exportType"
                class="w-full h-[40px] px-3 text-xs border border-[#D1D5DB] rounded-[8px] bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors">
                <option value="taps">Today's Tap Activity</option>
                <option value="analytics">Analytics Summary</option>
                <option value="audit">Audit Report</option>
                <option value="full">Full Report</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-medium text-[#111827] mb-1">Format</label>
              <div class="flex gap-4">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="format" [value]="'csv'" [(ngModel)]="exportFormat"
                    class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500">
                  <span class="text-xs text-[#111827]">CSV</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="format" [value]="'excel'" [(ngModel)]="exportFormat"
                    class="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500">
                  <span class="text-xs text-[#111827]">Excel</span>
                </label>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <lib-button type="secondary" label="Cancel" (onClick)="showExportModal = false"></lib-button>
            <lib-button type="primary" label="Generate" (onClick)="onGenerateExport()" [disabled]="generatingExport" [loading]="generatingExport"></lib-button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ReportsDashboardComponent implements OnInit, OnDestroy {
  Math = Math;

  // KPIs
  kpiCards: KpiCard[] = [
    { label: 'Meals Served Today', value: 0, icon: '', color: '', accent: 'blue' },
    { label: 'Active Subscribers', value: 0, icon: '', color: '', accent: 'green' },
    { label: 'Absent Today', value: 0, icon: '', color: '', accent: 'orange' },
    { label: 'Paused', value: 0, icon: '', color: '', accent: 'purple' },
    { label: 'Anomalies', value: 0, icon: '', color: '', accent: 'red' },
  ];

  // Meal bars
  mealBars: MealBar[] = [];
  barColors = ['#155DFC', '#007A55', '#FE9A00', '#7C3AED', '#C70036'];

  // Taps table
  tapColumns: TableColumn[] = [
    { key: 'customer', label: 'Subscriber', sortable: true, minWidth: '160px' },
    { key: 'roll_number', label: 'Roll Number', sortable: true, minWidth: '130px' },
    { key: 'mealSlot', label: 'Meal Slot', sortable: true, minWidth: '110px' },
    { key: 'time', label: 'Time', sortable: true, minWidth: '100px' },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      type: 'badge',
      minWidth: '100px',
      colorMap: {
        'Allowed': { bg: '#F0FDF4', text: '#007A55' },
        'Not Subscribed': { bg: '#FFF1F2', text: '#C70036' },
      },
    },
  ];
  tapData: MealEntry[] = [];
  tapsLoading = false;

  exportOptions = [
    { key: 'csv', label: 'Export as CSV', svgPath: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3' },
    { key: 'excel', label: 'Export as Excel', svgPath: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3' },
  ];

  // Export modal
  showExportModal = false;
  exportType = 'taps';
  exportFormat = 'csv';
  generatingExport = false;

  private subscriptions = new Subscription();

  exportSuccess: string | null = null;

  constructor(
    private reportsService: ReportsService,
    private dashboardService: DashboardService,
    private toast: SharedToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.loadAnalytics();
    this.loadTaps();
  }

  private loadAnalytics() {
    this.reportsService.getAnalyticsDashboard().subscribe({
      next: (analytics) => {
        this.kpiCards[0].value = analytics.totalTaps;
        this.kpiCards[1].value = analytics.totalActiveSubscribers;
        this.kpiCards[2].value = Math.max(0, analytics.totalActiveSubscribers - analytics.totalTaps);
        this.kpiCards[3].value = analytics.pausedCount;
        this.kpiCards[4].value = 0; // anomalies fetched separately

        this.buildMealBars(analytics.mealDistribution);
        this.cdr.detectChanges();
      },
      error: () => this.cdr.detectChanges()
    });

    this.reportsService.getAnomalies(48).subscribe({
      next: (anomalies) => {
        this.kpiCards[4].value = anomalies.length;
        this.cdr.detectChanges();
      },
      error: () => this.cdr.detectChanges()
    });
  }

  private buildMealBars(distribution: MealDistribution[]) {
    this.mealBars = distribution.map((d, i) => ({
      name: d.slotName,
      served: d.tapCount,
      total: d.subscriberCount,
      percent: d.subscriberCount > 0 ? Math.round((d.tapCount / d.subscriberCount) * 100) : 0,
      color: this.barColors[i % this.barColors.length],
    }));
  }

  private loadTaps() {
    this.tapsLoading = true;
    this.dashboardService.getTaps().subscribe({
      next: (taps) => {
        this.tapData = taps;
        this.tapsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.tapsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onTableExport(format: string) {
    if (this.tapData.length === 0) return;
    const headers = this.tapColumns.map(c => c.label);
    const rows = this.tapData.map(row =>
      this.tapColumns.map(c => {
        const val = (row as any)[c.key];
        return val != null ? String(val).replace(/,/g, ' ') : '';
      })
    );
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tap-activity-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  onGenerateExport() {
    this.generatingExport = true;
    this.exportSuccess = null;
    this.reportsService.triggerExport().subscribe({
      next: (res) => {
        this.generatingExport = false;
        const fileName = res?.file || res?.file_name || '';
        this.exportSuccess = fileName
          ? `Export generated: ${fileName}`
          : 'Export generated successfully';
        this.toast.success(this.exportSuccess);
        this.cdr.detectChanges();
      },
      error: () => {
        this.generatingExport = false;
        this.toast.error('Export failed. Please try again.');
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
