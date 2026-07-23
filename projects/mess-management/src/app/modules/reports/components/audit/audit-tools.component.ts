import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { SubTabsModule } from '@libs/sub-tabs';
import { TableModule, TableColumn } from '@libs/table';
import { ButtonComponent } from '@libs/shared-ui';
import { DatePickerModule } from '@libs/date-picker';
import { ReportsService } from '../../services/reports.service';

interface SubTabItem { id: string; label: string; count?: number; }

@Component({
  selector: 'app-audit-tools',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SubTabsModule, TableModule, ButtonComponent, DatePickerModule],
  providers: [ReportsService],
  template: `
    <div class="flex flex-col gap-5">
      <div class="flex items-center gap-3">
        <span class="text-sm font-semibold text-[#111827]">Audit Tools</span>
        <span class="text-[10px] text-[#6B7280]">Pause audits and change logs</span>
      </div>

      <div class="flex flex-col bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
        <div class="border-b border-[#E5E7EB] px-4 sm:px-6 py-4">
          <lib-sub-tabs [tabs]="subTabs" [activeTabId]="activeTab" (tabChange)="onTabChange($event)"></lib-sub-tabs>
        </div>

        <div class="p-4 sm:p-6">

          <!-- ══════ Pause Audit ══════ -->
          <div *ngIf="activeTab === 'pause-audit'">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
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
              [stickyActions]="true"
              [clientPagination]="true"
              [pagination]="{ currentPage: 1, itemsPerPage: 10, totalItems: pauseAuditData.length, totalPages: Math.ceil(pauseAuditData.length / 10) }"
            ></lib-table>
            <div *ngIf="!pauseAuditLoading && pauseAuditData.length === 0" class="text-xs text-[#6B7280] text-center py-6">
              No pause violations found. All paused subscribers appear compliant.
            </div>
          </div>

          <!-- ══════ Change Log ══════ -->
          <div *ngIf="activeTab === 'changelog'">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
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
                <option value="HOLIDAY_MARKED">Holiday Marked</option>
                <option value="HOLIDAY_DELETED">Holiday Deleted</option>
                <option value="TAP_REJECTED">Tap Rejected</option>
                <option value="SCHEDULE_CREATED">Schedule Created</option>
                <option value="SCHEDULE_MODIFIED">Schedule Modified</option>
                <option value="SCHEDULE_DELETED">Schedule Deleted</option>
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
              [stickyActions]="true"
              [clientPagination]="true"
              [pagination]="{ currentPage: 1, itemsPerPage: 10, totalItems: changelogData.length, totalPages: Math.ceil(changelogData.length / 10) || 1 }"
            ></lib-table>
            <div *ngIf="!changelogLoading && changelogData.length === 0" class="text-xs text-[#6B7280] text-center py-6">
              No change log entries found.
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
    { id: 'changelog', label: 'Change Log' },
    { id: 'pause-audit', label: 'Pause Audit' },
  ];
  activeTab = 'changelog';

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
        'HOLIDAY_MARKED': { bg: '#F3E8FF', text: '#7C3AED' },
        'HOLIDAY_DELETED': { bg: '#FEF2F2', text: '#C70036' },
        'TAP_REJECTED': { bg: '#FEF2F2', text: '#C70036' },
        'SCHEDULE_CREATED': { bg: '#ECFEFF', text: '#0E7490' },
        'SCHEDULE_MODIFIED': { bg: '#ECFEFF', text: '#0E7490' },
        'SCHEDULE_DELETED': { bg: '#FEF2F2', text: '#C70036' },
        'SUPER_USER_CREATED': { bg: '#F3E8FF', text: '#7C3AED' },
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
  changelogSize = 10;
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

  private changelogRollSubject = new Subject<string>();
  private changelogRollSub: Subscription | null = null;

  ngOnInit() {
    this.changelogRollSub = this.changelogRollSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => this.loadChangelog());
    this.loadChangelog();
    this.runAudit();
  }

  ngOnDestroy() {
    this.changelogRollSub?.unsubscribe();
  }

  onTabChange(tabId: string) {
    this.activeTab = tabId;
  }

  constructor(
    private reportsService: ReportsService,
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

}
