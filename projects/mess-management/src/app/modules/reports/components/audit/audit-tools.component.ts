import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { SubTabsModule } from '@libs/sub-tabs';
import { TableModule, TableColumn } from '@libs/table';
import { ButtonComponent } from '@libs/shared-ui';
import { PillTabsModule, PillTabItem } from '@libs/pill-tabs';
import { DatePickerModule } from '@libs/date-picker';
import { ReportsService } from '../../services/reports.service';
import { DashboardService } from '../../../dashboard/services/dashboard.service';
import { SubscriberService } from '../../../subscriber-management/services/subscriber.service';
import { MealEntry } from '../../../../shared/models/dashboard.models';

interface SubTabItem { id: string; label: string; count?: number; }

interface SubscriptionIssue {
  rollNumber: string;
  name: string;
  issue: string;
  severity: 'high' | 'medium' | 'low';
  detail: string;
}

@Component({
  selector: 'app-audit-tools',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SubTabsModule, TableModule, ButtonComponent, PillTabsModule, DatePickerModule],
  providers: [ReportsService, DashboardService, SubscriberService],
  template: `
    <div class="flex flex-col gap-5">
      <div class="flex items-center gap-3">
        <span class="text-sm font-semibold text-[#111827]">Audit Tools</span>
        <span class="text-[10px] text-[#6B7280]">Pause audits, anomaly detection, and change logs</span>
      </div>

      <div class="flex flex-col bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
        <div class="border-b border-[#E5E7EB] px-6 py-4">
          <lib-sub-tabs [tabs]="subTabs" [activeTabId]="activeTab" (tabChange)="onTabChange($event)"></lib-sub-tabs>
        </div>

        <div class="p-6">

          <!-- ══════ Pause Audit ══════ -->
          <div *ngIf="activeTab === 'pause-audit'">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-semibold text-[#111827]">Pause Compensation Audit</span>
              <lib-button type="primary" label="Run Audit" (onClick)="runAudit()" [loading]="pauseAuditLoading"></lib-button>
            </div>
            <div *ngIf="!pauseAuditLoading && pauseAuditData.length > 0"
              class="flex items-center gap-2 mb-4 px-4 py-3 bg-[#FFF7ED] border border-[#FED7AA] rounded-xl">
              <span class="text-xs font-semibold text-[#BB4D00]">{{ pauseAuditData.length }} violation{{ pauseAuditData.length > 1 ? 's' : '' }} found</span>
              <span class="text-[10px] text-[#92400E]">across {{ uniquePauseViolators }} paused subscriber{{ uniquePauseViolators > 1 ? 's' : '' }}</span>
            </div>
            <lib-table
              [columns]="pauseAuditColumns"
              [data]="pauseAuditData"
              [loading]="pauseAuditLoading"
              [showToolbar]="false"
              [stickyActions]="false"
              [clientPagination]="true"
              [pagination]="{ currentPage: 1, itemsPerPage: 20, totalItems: pauseAuditData.length, totalPages: Math.ceil(pauseAuditData.length / 20) }"
            ></lib-table>
            <div *ngIf="!pauseAuditLoading && pauseAuditData.length === 0" class="text-xs text-[#6B7280] text-center py-6">
              No pause violations found. All paused subscribers appear compliant.
            </div>
          </div>

          <!-- ══════ Anomaly Detector ══════ -->
          <div *ngIf="activeTab === 'anomalies'">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-semibold text-[#111827]">Anomaly Detection</span>
              <div class="flex items-center gap-3">
                <span class="text-[10px] text-[#6B7280]">Lookback</span>
                <select [(ngModel)]="anomalyHours" (change)="loadAnomalies()"
                  class="h-[32px] px-3 text-xs border border-[#D1D5DB] rounded-[8px] bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors">
                  <option [value]="24">24 hours</option>
                  <option [value]="48">48 hours</option>
                  <option [value]="72">7 days</option>
                </select>
              </div>
            </div>
            <div class="mb-4">
              <lib-pill-tabs [tabs]="severityTabs" [activeTabId]="activeSeverityTab" (tabChange)="onSeverityTabChange($event)"></lib-pill-tabs>
            </div>
            <lib-table
              [columns]="anomalyColumns"
              [data]="filteredAnomalyData"
              [loading]="anomalyLoading"
              [showToolbar]="false"
              [stickyActions]="false"
              [clientPagination]="true"
              [pagination]="{ currentPage: 1, itemsPerPage: 20, totalItems: filteredAnomalyData.length, totalPages: Math.ceil(filteredAnomalyData.length / 20) }"
            ></lib-table>
            <div *ngIf="!anomalyLoading && anomalyData.length === 0" class="text-xs text-[#6B7280] text-center py-6">
              No anomalies detected in the selected period.
            </div>
          </div>

          <!-- ══════ Change Log ══════ -->
          <div *ngIf="activeTab === 'changelog'">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-semibold text-[#111827]">Change Log Explorer</span>
              <lib-button type="secondary" label="Export" (onClick)="exportChangelog()"></lib-button>
            </div>
            <div class="flex items-center gap-3 mb-4 flex-wrap">
              <select [(ngModel)]="changelogActionFilter" (change)="onChangelogFilterChange()"
                class="h-[36px] px-3 text-xs border border-[#D1D5DB] rounded-[8px] bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors">
                <option value="">All Actions</option>
                <option value="SUBSCRIPTION_CREATED">Created</option>
                <option value="SUBSCRIPTION_MODIFIED">Modified</option>
                <option value="SUBSCRIPTION_RENEWED">Renewed</option>
                <option value="SUBSCRIPTION_DELETED">Deleted</option>
                <option value="PAUSE_REQUESTED">Pause Requested</option>
                <option value="PAUSE_STARTED">Pause Started</option>
                <option value="PAUSE_EXTENDED">Pause Extended</option>
                <option value="PAUSE_ENDED">Pause Ended</option>
                <option value="PAUSE_AUTO_STARTED">Pause Auto-Started</option>
                <option value="CARD_BLOCKED">Card Blocked</option>
                <option value="CARD_UNBLOCKED">Card Unblocked</option>
                <option value="HOLIDAY_MARKED">Holiday Marked</option>
              </select>
              <div class="relative flex-1 max-w-xs">
                <input type="text" [(ngModel)]="changelogRollNumber" (input)="onChangelogRollInput()"
                  placeholder="Filter by roll number..."
                  class="w-full h-[36px] pl-3 pr-3 text-xs border border-[#D1D5DB] rounded-[8px] bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors" />
              </div>
              <div class="flex items-center gap-2">
                <lib-date-picker
                  [initialStartDate]="changelogStartDate"
                  [initialEndDate]="changelogEndDate"
                  placeholder="Filter by date range"
                  (dateRangeSelected)="onChangelogRangeSelect($event)"
                  (onClear)="onChangelogRangeClear()">
                </lib-date-picker>
              </div>
            </div>
            <lib-table
              [columns]="changelogColumns"
              [data]="changelogData"
              [loading]="changelogLoading"
              [showToolbar]="false"
              [stickyActions]="false"
              [clientPagination]="true"
              [pagination]="{ currentPage: 1, itemsPerPage: 30, totalItems: changelogData.length, totalPages: Math.ceil(changelogData.length / 30) || 1 }"
            ></lib-table>
            <div *ngIf="!changelogLoading && changelogData.length === 0" class="text-xs text-[#6B7280] text-center py-6">
              No change log entries found.
            </div>
          </div>

          <!-- ══════ Subscription Audit ══════ -->
          <div *ngIf="activeTab === 'subscription-audit'">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-semibold text-[#111827]">Subscription Audit</span>
              <lib-button type="primary" label="Run Audit" (onClick)="runSubscriptionAudit()" [loading]="subAuditLoading"></lib-button>
            </div>
            <div *ngIf="!subAuditLoading && subAuditData.length > 0"
              class="flex items-center gap-2 mb-4 px-4 py-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl">
              <span class="text-xs font-semibold text-[#C70036]">{{ subAuditData.length }} issue{{ subAuditData.length > 1 ? 's' : '' }} detected</span>
              <span class="text-[10px] text-[#991B1B]">
                <ng-container *ngIf="subAuditSeverityCounts.high > 0">{{ subAuditSeverityCounts.high }} high &middot; </ng-container>
                {{ subAuditSeverityCounts.medium }} medium &middot; {{ subAuditSeverityCounts.low }} low
              </span>
            </div>
            <lib-table
              [columns]="subAuditColumns"
              [data]="subAuditData"
              [loading]="subAuditLoading"
              [showToolbar]="false"
              [stickyActions]="false"
              [clientPagination]="true"
              [pagination]="{ currentPage: 1, itemsPerPage: 20, totalItems: subAuditData.length, totalPages: Math.ceil(subAuditData.length / 20) }"
            ></lib-table>
            <div *ngIf="!subAuditLoading && subAuditData.length === 0" class="text-xs text-[#6B7280] text-center py-6">
              No subscription issues found. Click "Run Audit" to check.
            </div>
          </div>

        </div>
      </div>
    </div>
  `
})
export class AuditToolsComponent implements OnInit, OnDestroy {
  Math = Math;

  subTabs: SubTabItem[] = [
    { id: 'pause-audit', label: 'Pause Audit' },
    { id: 'anomalies', label: 'Anomaly Detector' },
    { id: 'changelog', label: 'Change Log' },
    { id: 'subscription-audit', label: 'Subscription Audit' },
  ];
  activeTab = 'pause-audit';

  // ── Pause Audit ──────────────────────────────────────────────────
  pauseAuditColumns: TableColumn[] = [
    { key: 'rollNumber', label: 'ROLL NUMBER', sortable: true, minWidth: '130px' },
    { key: 'pauseStart', label: 'PAUSE START', minWidth: '120px' },
    { key: 'pauseEnd', label: 'PAUSE END', minWidth: '120px' },
    { key: 'reason', label: 'REASON', minWidth: '160px' },
    { key: 'tapsDuringPause', label: 'TAPS DURING PAUSE', minWidth: '90px' },
    { key: 'compensatedDays', label: 'COMP DAYS', minWidth: '100px' },
  ];
  pauseAuditData: any[] = [];
  pauseAuditLoading = false;
  get uniquePauseViolators(): number {
    return new Set(this.pauseAuditData.map((d: any) => d.rollNumber)).size;
  }

  // ── Anomaly Detector ──────────────────────────────────────────────
  severityTabs: PillTabItem[] = [
    { id: 'all', label: 'All' },
    { id: 'high', label: 'High' },
    { id: 'medium', label: 'Medium' },
    { id: 'low', label: 'Low' },
  ];
  activeSeverityTab = 'all';
  anomalyHours = 48;
  anomalyColumns: TableColumn[] = [
    { key: 'rollNumber', label: 'ROLL NUMBER', sortable: true, minWidth: '130px' },
    { key: 'studentName', label: 'NAME', minWidth: '160px' },
    { key: 'mealSlot', label: 'MEAL SLOT', minWidth: '110px' },
    { key: 'tapTimestamp', label: 'TIME', minWidth: '140px' },
    { key: 'reason', label: 'REASON', minWidth: '160px' },
    { key: 'severity', label: 'SEVERITY', type: 'badge', minWidth: '100px',
      colorMap: {
        'high': { bg: '#FEF2F2', text: '#C70036' },
        'medium': { bg: '#FFF7ED', text: '#BB4D00' },
        'low': { bg: '#EFF6FF', text: '#155DFC' },
      }
    },
  ];
  anomalyData: any[] = [];
  anomalyLoading = false;
  get filteredAnomalyData(): any[] {
    if (this.activeSeverityTab === 'all') return this.anomalyData;
    return this.anomalyData.filter((d: any) => d.severity === this.activeSeverityTab);
  }

  // ── Change Log ────────────────────────────────────────────────────
  changelogColumns: TableColumn[] = [
    { key: 'timestamp', label: 'TIMESTAMP', sortable: true, minWidth: '170px' },
    { key: 'rollNumber', label: 'ROLL NUMBER', sortable: true, minWidth: '130px' },
    {
      key: 'action', label: 'ACTION', type: 'badge', sortable: true, minWidth: '130px',
      colorMap: {
        'SUBSCRIPTION_CREATED': { bg: '#F0FDF4', text: '#007A55' },
        'SUBSCRIPTION_RENEWED': { bg: '#F0FDF4', text: '#007A55' },
        'SUBSCRIPTION_MODIFIED': { bg: '#EFF6FF', text: '#155DFC' },
        'SUBSCRIPTION_DELETED': { bg: '#FEF2F2', text: '#C70036' },
        'PAUSE_REQUESTED': { bg: '#F3E8FF', text: '#7C3AED' },
        'PAUSE_STARTED': { bg: '#FFF7ED', text: '#BB4D00' },
        'PAUSE_EXTENDED': { bg: '#FFF7ED', text: '#BB4D00' },
        'PAUSE_ENDED': { bg: '#F0FDF4', text: '#007A55' },
        'PAUSE_AUTO_STARTED': { bg: '#EFF6FF', text: '#155DFC' },
        'CARD_BLOCKED': { bg: '#FEF2F2', text: '#C70036' },
        'CARD_UNBLOCKED': { bg: '#F0FDF4', text: '#007A55' },
        'HOLIDAY_MARKED': { bg: '#F3E8FF', text: '#7C3AED' },
      }
    },
    { key: 'description', label: 'DESCRIPTION', minWidth: '300px' },
  ];
  changelogData: any[] = [];
  changelogLoading = false;
  changelogActionFilter = '';
  changelogRollNumber = '';
  changelogStartDate: Date | null = null;
  changelogEndDate: Date | null = null;
  changelogFrom = '';
  changelogTo = '';
  changelogPage = 1;
  changelogSize = 30;
  changelogTotal = 0;
  private changelogRawData: any[] = [];
  get changelogPagination() {
    return {
      currentPage: this.changelogPage,
      itemsPerPage: this.changelogSize,
      totalItems: this.changelogTotal,
      totalPages: Math.ceil(this.changelogTotal / this.changelogSize) || 1,
    };
  }

  // ── Subscription Audit ────────────────────────────────────────────
  subAuditColumns: TableColumn[] = [
    { key: 'rollNumber', label: 'ROLL NUMBER', sortable: true, minWidth: '130px' },
    { key: 'name', label: 'NAME', minWidth: '160px' },
    { key: 'issue', label: 'ISSUE', minWidth: '180px' },
    {
      key: 'severity', label: 'SEVERITY', type: 'badge', minWidth: '100px',
      colorMap: {
        'high': { bg: '#FEF2F2', text: '#C70036' },
        'medium': { bg: '#FFF7ED', text: '#BB4D00' },
        'low': { bg: '#EFF6FF', text: '#155DFC' },
      }
    },
    { key: 'detail', label: 'DETAIL', minWidth: '280px' },
  ];
  subAuditData: SubscriptionIssue[] = [];
  subAuditLoading = false;
  get subAuditSeverityCounts() {
    return {
      high: this.subAuditData.filter(d => d.severity === 'high').length,
      medium: this.subAuditData.filter(d => d.severity === 'medium').length,
      low: this.subAuditData.filter(d => d.severity === 'low').length,
    };
  }

  private changelogRollSubject = new Subject<string>();
  private changelogRollSub: Subscription | null = null;

  ngOnInit() {
    this.changelogRollSub = this.changelogRollSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => this.loadChangelog());
    this.runAudit();
    this.loadAnomalies();
    this.loadChangelog();
  }

  ngOnDestroy() {
    this.changelogRollSub?.unsubscribe();
  }

  onTabChange(tabId: string) {
    this.activeTab = tabId;
  }

  constructor(
    private reportsService: ReportsService,
    private dashboardService: DashboardService,
    private subscriberService: SubscriberService,
    private cdr: ChangeDetectorRef
  ) {}

  // ── Pause Audit ──────────────────────────────────────────────────

  runAudit() {
    this.pauseAuditLoading = true;
    this.reportsService.getPauseAudit().subscribe({
      next: data => {
        this.pauseAuditData = data;
        this.pauseAuditLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.pauseAuditLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Anomaly Detector ─────────────────────────────────────────────

  onSeverityTabChange(tabId: string) {
    this.activeSeverityTab = tabId;
  }

  loadAnomalies() {
    this.anomalyLoading = true;
    this.reportsService.getAnomalies(this.anomalyHours).subscribe({
      next: data => {
        this.anomalyData = data;
        this.anomalyLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.anomalyLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Change Log ───────────────────────────────────────────────────

  onChangelogFilterChange() {
    this.changelogPage = 1;
    this.loadChangelog();
  }

  onChangelogRollInput() {
    this.changelogRollSubject.next(this.changelogRollNumber);
  }

  onChangelogDateChange(value: string, field: 'from' | 'to') {
    if (field === 'from') this.changelogFrom = value;
    else this.changelogTo = value;
    this.changelogPage = 1;
    this.loadChangelog();
  }

  onChangelogRangeSelect(range: { from: Date; to: Date | null }) {
    this.changelogStartDate = range.from;
    this.changelogEndDate = range.to;
    this.changelogFrom = range.from ? range.from.getTime().toString() : '';
    this.changelogTo = range.to ? range.to.getTime().toString() : '';
    this.changelogPage = 1;
    this.loadChangelog();
  }

  onChangelogRangeClear() {
    this.changelogStartDate = null;
    this.changelogEndDate = null;
    this.changelogFrom = '';
    this.changelogTo = '';
    this.changelogPage = 1;
    this.loadChangelog();
  }

  onChangelogPageChange(page: number) {
    this.changelogPage = page;
    this.loadChangelog();
  }

  onChangelogSizeChange(size: number) {
    this.changelogSize = size;
    this.changelogPage = 1;
    this.loadChangelog();
  }

  private loadChangelog() {
    this.changelogLoading = true;
    const rollFilter = this.changelogRollNumber?.trim().toLowerCase();
    const actionFilter = this.changelogActionFilter;
    const fromTs = this.changelogFrom ? Number(this.changelogFrom) : 0;
    const toTs = this.changelogTo ? Number(this.changelogTo) : 0;

    this.reportsService.getChangelog({
      page: 0,
      size: 500,
    }).subscribe({
      next: res => {
        const mapped = this.mapChangelogEntries(res.data || []);
        this.changelogRawData = mapped;
        this.changelogData = this.applyChangelogFilters(mapped, rollFilter, actionFilter, fromTs, toTs);
        this.changelogLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.changelogLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private applyChangelogFilters(data: any[], rollFilter: string, actionFilter: string, fromTs: number, toTs: number): any[] {
    return data.filter(entry => {
      if (rollFilter && !entry.rollNumber.toLowerCase().includes(rollFilter)) return false;
      if (actionFilter && entry.action !== actionFilter) return false;
      if (fromTs && entry.timestamp < fromTs) return false;
      if (toTs && entry.timestamp > toTs) return false;
      return true;
    });
  }

  private mapChangelogEntries(entries: any[]): any[] {
    return entries.map((entry: any) => ({
      timestamp: entry.timestamp ? new Date(entry.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
      rollNumber: entry.rollNumber || '',
      action: entry.action || '',
      description: entry.description || '',
    }));
  }

  exportChangelog() {
    const rows = this.changelogData.map((d: any) => `${d.timestamp},${d.rollNumber},${d.action},"${d.description}"`);
    const csv = ['Timestamp,Roll Number,Action,Description', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `changelog-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Subscription Audit ───────────────────────────────────────────

  runSubscriptionAudit() {
    this.subAuditLoading = true;
    this.subAuditData = [];

    this.subscriberService.getSubscribers('', 0, 10000).subscribe({
      next: ({ subscribers }) => {
        this.dashboardService.getSchedules().subscribe({
          next: (mealSlots) => {
            this.dashboardService.getTaps().subscribe({
              next: (taps) => {
                this.subAuditData = this.computeSubscriptionIssues(subscribers, mealSlots, taps);
                this.subAuditLoading = false;
                this.cdr.detectChanges();
              },
              error: () => {
                this.subAuditLoading = false;
                this.cdr.detectChanges();
              }
            });
          },
          error: () => {
            this.subAuditLoading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: () => {
        this.subAuditLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private computeSubscriptionIssues(subscribers: any[], mealSlots: any[], taps: MealEntry[]): SubscriptionIssue[] {
    const issues: SubscriptionIssue[] = [];
    const activeSlotCodes = new Set(mealSlots.map((s: any) => s.code));
    const activeSlotNames = new Set(mealSlots.map((s: any) => s.name.toUpperCase()));
    const tapRollNumbers = new Set(taps.map(t => t.roll_number));

    for (const sub of subscribers) {
      const status = sub.status || '';
      const cardStatus = sub.card_blocked ? 'blocked' : 'active';
      const mealPlan = sub.mealPlan || sub.meal_plan || '';
      const name = sub.name || '';
      const rollNumber = sub.roll_number || '';

      // 1. Expired subscriber with recent taps
      if ((status === 'Expired' || status === 'Lapsed') && tapRollNumbers.has(rollNumber)) {
        issues.push({
          rollNumber,
          name,
          issue: 'Expired subscriber tapped',
          severity: 'high',
          detail: `Subscription ${status.toLowerCase()}, but has ${taps.filter(t => t.roll_number === rollNumber).length} tap(s) today.`
        });
      }

      // 2. Blocked card with active subscription
      if (status === 'Active' && cardStatus === 'blocked') {
        issues.push({
          rollNumber,
          name,
          issue: 'Blocked card on active subscription',
          severity: 'high',
          detail: 'Card is blocked but subscription is still active. Unblock card or investigate.'
        });
      }

      // 3a. Meal plan codes reference inactive/deleted slots
      if (mealPlan && mealPlan !== 'None') {
        const planChars = mealPlan.split('+');
        for (const char of planChars) {
          if (!activeSlotCodes.has(char)) {
            issues.push({
              rollNumber,
              name,
              issue: 'Meal plan mismatch',
              severity: 'medium',
              detail: `Plan includes "${char}" which no longer exists as an active meal slot.`
            });
            break;
          }
        }
      }

      // 3b. Meal names that don't match any schedule slot (e.g. deleted slot)
      const mealNames = sub.mealNames || [];
      for (const mealName of mealNames) {
        if (!activeSlotNames.has(mealName.toUpperCase())) {
          issues.push({
            rollNumber,
            name,
            issue: 'Meal plan mismatch',
            severity: 'medium',
            detail: `Subscription includes "${mealName}" which is not available in the current schedule.`
          });
          break;
        }
      }

      // 4. Paused with no end date for too long (7+ days)
      if (status === 'Paused') {
        const pauseStart = sub.pauseStartDate;
        if (pauseStart && pauseStart.includes('/')) {
          const parts = pauseStart.split('/');
          const pauseDate = new Date(2000 + parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
          const daysPaused = Math.floor((Date.now() - pauseDate.getTime()) / 86400000);
          if (daysPaused > 7) {
            issues.push({
              rollNumber,
              name,
              issue: 'Extended pause',
              severity: 'low',
              detail: `Paused for ${daysPaused} days without resolution.`
            });
          }
        }
      }
    }

    return issues;
  }
}
