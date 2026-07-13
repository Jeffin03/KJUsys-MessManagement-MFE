import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { TableModule, TableColumn, PaginationConfig } from '@libs/table';
import { ButtonComponent } from '@libs/shared-ui';
import { SharedToastService } from '@libs/shared-toast';
import { DatePickerModule } from '@libs/date-picker';
import { DropdownLibModule } from '@libs/dropdown-lib';
import { ReportsService } from '../../services/reports.service';
import { DailyAnalytics } from '../../models/reports.models';
import { DashboardService } from '../../../dashboard/services/dashboard.service';
import { MealEntry } from '../../../../shared/models/dashboard.models';


interface KpiCard {
  label: string;
  value: number;
  icon: string;
  color: string;
  accent: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonComponent,
    DatePickerModule, DropdownLibModule
  ],
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
            [pagination]="{ currentPage: 1, itemsPerPage: 10, totalItems: tapData.length, totalPages: Math.ceil(tapData.length / 10) }"
          ></lib-table>
          <div *ngIf="!tapsLoading && tapData.length === 0" class="text-xs text-[#6B7280] text-center py-6">
            No taps recorded today.
          </div>
        </div>
      </div>

      <!-- Export Modal -->
      <div *ngIf="showExportModal"
        class="fixed inset-0 bg-black/55 z-[1000] flex items-center justify-center p-4"
        (click)="closeExportModal()">
        <div class="relative w-full max-w-2xl mx-4 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col bg-white"
          style="height:680px; max-height:90vh;"
          (click)="$event.stopPropagation()">

          <!-- Fixed Header -->
          <div class="px-7 pt-5 bg-white border-b border-[#E5E7EB] rounded-t-2xl flex-shrink-0">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-sm font-semibold text-[#111827]">Export Report</span>
                <p class="text-xs font-medium text-[#86868B] mt-0.5 mb-4">Generate multi-sheet Excel workbook</p>
              </div>
              <button (click)="closeExportModal()" class="text-[#6B7280] hover:text-[#111827] transition-colors text-lg leading-none p-1">
                &#x2715;
              </button>
            </div>
          </div>

          <!-- Scrollable Content -->
          <div class="overflow-y-auto flex-1 bg-white p-7 space-y-5">

            <!-- Report Type -->
            <div>
              <label class="block text-[10px] font-medium text-[#6B7280] mb-1.5">REPORT TYPE</label>
              <div class="flex gap-2">
                <button (click)="exportReportType = 'today'"
                  class="px-3 py-1.5 text-[10px] font-semibold rounded-full transition-colors"
                  [class]="exportReportType === 'today' ? 'bg-[#EEF2FF] text-[#155DFC]' : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'">
                  Today's Report
                </button>
                <button (click)="exportReportType = 'full'"
                  class="px-3 py-1.5 text-[10px] font-semibold rounded-full transition-colors"
                  [class]="exportReportType === 'full' ? 'bg-[#EEF2FF] text-[#155DFC]' : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'">
                  Full Report
                </button>
              </div>
            </div>

            <!-- Format -->
            <div>
              <label class="block text-[10px] font-medium text-[#6B7280] mb-1.5">FORMAT</label>
              <div class="flex gap-2">
                <button (click)="exportFormat = 'xlsx'"
                  class="px-3 py-1.5 text-[10px] font-semibold rounded-full transition-colors"
                  [class]="exportFormat === 'xlsx' ? 'bg-[#EEF2FF] text-[#155DFC]' : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'">
                  Excel (.xlsx)
                </button>
                <button (click)="exportFormat = 'csv'"
                  class="px-3 py-1.5 text-[10px] font-semibold rounded-full transition-colors"
                  [class]="exportFormat === 'csv' ? 'bg-[#EEF2FF] text-[#155DFC]' : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'">
                  CSV (.csv)
                </button>
              </div>
            </div>

            <!-- Date Range -->
            <div>
              <label class="block text-[10px] font-medium text-[#6B7280] mb-1.5">DATE RANGE</label>
              <lib-date-picker
                [initialStartDate]="exportStartDate"
                [initialEndDate]="exportEndDate"
                placeholder="Select date range (optional)"
                (dateRangeSelected)="onExportDateRangeSelect($event)"
                (onClear)="onExportDateRangeClear()">
              </lib-date-picker>
            </div>

            <!-- Meal Slots -->
            <div>
              <label class="block text-[10px] font-medium text-[#6B7280] mb-1.5">MEAL SLOTS</label>
              <lib-dropdown-lib
                placeholder="All meal slots"
                [singleSelection]="false"
                [data]="availableMealSlots"
                idField="id"
                textField="label"
                [label]="''"
                [selectedItems]="selectedMealSlots"
                (selectionChange)="onMealSlotSelectionChange($event)">
              </lib-dropdown-lib>
            </div>

            <!-- Students -->
            <div>
              <label class="block text-[10px] font-medium text-[#6B7280] mb-1.5">STUDENT ROLL NUMBERS (OPTIONAL)</label>
              <input type="text" [(ngModel)]="exportRollNumbersInput" placeholder="e.g. 25MCAB24, 25MCAB25 (comma-separated)"
                class="w-full h-[40px] px-3 text-xs border border-[#D1D5DB] rounded-[8px] bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                (input)="exportRollNumbersInput = $any($event.target).value.toUpperCase()">
            </div>

            <!-- Include toggles + Output -->
            <div>
              <div class="flex gap-6 mb-4">
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <div class="relative">
                    <input type="checkbox" [(ngModel)]="exportIncludeSummary"
                      class="sr-only peer">
                    <div class="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-[#155DFC] transition-colors"></div>
                    <div class="absolute left-[2px] top-[2px] w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform"></div>
                  </div>
                  <span class="text-xs text-[#111827]">Include Summary sheet</span>
                </label>
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <div class="relative">
                    <input type="checkbox" [(ngModel)]="exportIncludeDetail"
                      class="sr-only peer">
                    <div class="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-[#155DFC] transition-colors"></div>
                    <div class="absolute left-[2px] top-[2px] w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform"></div>
                  </div>
                  <span class="text-xs text-[#111827]">Include Data sheet</span>
                </label>
              </div>

              <!-- Estimated output -->
              <div *ngIf="!generatingExport"
                class="flex items-center gap-2 px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
                <svg width="14" height="14" fill="none" stroke="#6B7280" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span class="text-[10px] text-[#6B7280]">
                  Output:
                  <span *ngIf="exportFormat === 'xlsx'">
                    <span *ngIf="exportIncludeSummary && exportIncludeDetail">Summary + Data sheets</span>
                    <span *ngIf="exportIncludeSummary && !exportIncludeDetail">Summary sheet only</span>
                    <span *ngIf="!exportIncludeSummary && exportIncludeDetail">Data sheet only</span>
                    <span *ngIf="!exportIncludeSummary && !exportIncludeDetail">Select at least one sheet</span>
                  </span>
                  <span *ngIf="exportFormat === 'csv'">Single CSV file</span>
                </span>
              </div>

              <!-- Progress indicator -->
              <div *ngIf="generatingExport"
                class="flex items-center gap-3 px-4 py-3 bg-[#EEF2FF] border border-[#C7D2FE] rounded-lg">
                <div class="w-4 h-4 border-2 border-[#155DFC] border-t-transparent rounded-full animate-spin"></div>
                <span class="text-xs font-medium text-[#155DFC]">Generating report...</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3">
              <lib-button type="secondary" label="Cancel" (onClick)="closeExportModal()"></lib-button>
              <lib-button type="primary" label="Generate & Download" (onClick)="onGenerateExport()"
                [disabled]="generatingExport || (!exportIncludeSummary && !exportIncludeDetail)"
                [loading]="generatingExport"></lib-button>
            </div>

          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }
    ::ng-deep lib-dropdown-lib .max-h-\\[220px\\] { max-height: 104px !important; }
  `]
})
export class ReportsDashboardComponent implements OnInit, OnDestroy {
  Math = Math;

  // KPIs
  kpiCards: KpiCard[] = [
    { label: 'Meals Served Today', value: 0, icon: '', color: '', accent: 'blue' },
    { label: 'Active Subscribers', value: 0, icon: '', color: '', accent: 'green' },
    { label: 'Expected Subscribers Today', value: 0, icon: '', color: '', accent: 'blue' },
    { label: 'Absent Today', value: 0, icon: '', color: '', accent: 'red' },
    { label: 'Paused', value: 0, icon: '', color: '', accent: 'orange' },
  ];

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

  // Export modal state
  showExportModal = false;
  generatingExport = false;
  exportFormat: 'xlsx' | 'csv' = 'xlsx';
  exportReportType: 'today' | 'full' = 'today';

  // Enhanced filter state
  exportStartDate: Date | null = null;
  exportEndDate: Date | null = null;
  exportRollNumbersInput = '';
  exportIncludeSummary = true;
  exportIncludeDetail = true;
  selectedMealSlots: any[] = [];
  availableMealSlots = [
    { id: 'BREAKFAST', label: 'Breakfast' },
    { id: 'BRUNCH', label: 'Brunch' },
    { id: 'LUNCH', label: 'Lunch' },
    { id: 'SNACKS', label: 'Snacks' },
    { id: 'DINNER', label: 'Dinner' },
  ];

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
        this.kpiCards[2].value = analytics.expectedActiveToday;
        this.kpiCards[3].value = Math.max(0, analytics.expectedActiveToday - analytics.totalTaps);
        this.kpiCards[4].value = analytics.pausedCount;

        this.cdr.detectChanges();
      },
      error: () => this.cdr.detectChanges()
    });
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

  onExportDateRangeSelect(event: { from: Date; to: Date | null }) {
    this.exportStartDate = event.from;
    this.exportEndDate = event.to;
  }

  onExportDateRangeClear() {
    this.exportStartDate = null;
    this.exportEndDate = null;
  }

  onMealSlotSelectionChange(items: any[]) {
    this.selectedMealSlots = items;
  }

  onGenerateExport() {
    this.generatingExport = true;
    this.exportSuccess = null;

    const params: any = {
      type: this.exportReportType,
      format: this.exportFormat,
    };

    if (this.exportStartDate) params.from = this.exportStartDate.getTime();
    if (this.exportEndDate) params.to = new Date(this.exportEndDate.getTime() + 86399999).getTime();

    const mealSlots = this.selectedMealSlots.map((s: any) => s.id);
    if (mealSlots.length > 0) params.mealSlots = mealSlots;

    const rollNumbers = this.exportRollNumbersInput
      .split(',')
      .map(r => r.trim())
      .filter(r => r.length > 0);
    if (rollNumbers.length > 0) params.rollNumbers = rollNumbers;

    // Only send these if user changed them from defaults
    if (!this.exportIncludeSummary) params.includeSummary = false;
    if (!this.exportIncludeDetail) params.includeDetail = false;

    this.reportsService.triggerFilteredExport(params).subscribe({
      next: (blob) => {
        this.generatingExport = false;
        this.showExportModal = false;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = this.exportFormat === 'csv' ? 'csv' : 'xlsx';
        a.download = `report-${new Date().toISOString().slice(0, 10)}.${ext}`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
        this.toast.success('Export downloaded');
        this.cdr.detectChanges();
      },
      error: () => {
        this.generatingExport = false;
        this.toast.error('Export failed. Please try again.');
        this.cdr.detectChanges();
      }
    });
  }

  closeExportModal() {
    this.showExportModal = false;
    this.generatingExport = false;
    this.exportStartDate = null;
    this.exportEndDate = null;
    this.exportRollNumbersInput = '';
    this.selectedMealSlots = [];
    this.exportIncludeSummary = true;
    this.exportIncludeDetail = true;
    this.exportFormat = 'xlsx';
    this.exportReportType = 'today';
  }

  openExportModal() {
    this.showExportModal = true;
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
