import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { SubTabsModule } from '@libs/sub-tabs';
import { TableModule } from '@libs/table';
import { ButtonComponent } from '@libs/shared-ui';
import type { TableColumn } from '@libs/table';
import { ReportsService } from '../../services/reports.service';

interface SubTabItem { id: string; label: string; count?: number; }

@Component({
  selector: 'app-audit-tools',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SubTabsModule, TableModule, ButtonComponent],
  providers: [ReportsService],
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
          <div *ngIf="activeTab === 'pause-audit'">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-semibold text-[#111827]">Pause Compensation Audit</span>
              <lib-button type="primary" label="Run Audit" (onClick)="runAudit()"></lib-button>
            </div>
            <lib-table
              [columns]="pauseAuditColumns"
              [data]="pauseAuditData"
              [loading]="pauseAuditLoading"
              [showToolbar]="false"
              [stickyActions]="false"
              [clientPagination]="true"
              [pagination]="{ currentPage: 1, itemsPerPage: 20, totalItems: pauseAuditData.length, totalPages: 1 }"
            ></lib-table>
            <div *ngIf="!pauseAuditLoading && pauseAuditData.length === 0" class="text-xs text-[#6B7280] text-center py-6">
              Click "Run Audit" to check for pause-to-tap discrepancies.
            </div>
          </div>

          <div *ngIf="activeTab === 'anomalies'">
            <span class="text-xs font-semibold text-[#111827] block mb-4">Anomaly Detection</span>
            <lib-table
              [columns]="anomalyColumns"
              [data]="anomalyData"
              [loading]="anomalyLoading"
              [showToolbar]="false"
              [stickyActions]="false"
              [clientPagination]="true"
              [pagination]="{ currentPage: 1, itemsPerPage: 20, totalItems: anomalyData.length, totalPages: 1 }"
            ></lib-table>
            <div *ngIf="!anomalyLoading && anomalyData.length === 0" class="text-xs text-[#6B7280] text-center py-6">
              No anomalies detected in the last 48 hours.
            </div>
          </div>

          <div *ngIf="activeTab === 'changelog'">
            <div class="flex items-center justify-between mb-4">
              <span class="text-xs font-semibold text-[#111827]">Change Log Explorer</span>
            </div>
            <div class="flex items-center gap-3 mb-4">
              <select [(ngModel)]="changelogActionFilter" (change)="onChangelogFilterChange()"
                class="h-[36px] px-3 text-xs border border-[#D1D5DB] rounded-[8px] bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors">
                <option value="">All Actions</option>
                <option value="SUBSCRIPTION_CREATED">Created</option>
                <option value="SUBSCRIPTION_MODIFIED">Modified</option>
                <option value="SUBSCRIPTION_RENEWED">Renewed</option>
                <option value="SUBSCRIPTION_DELETED">Deleted</option>
                <option value="PAUSE_STARTED">Pause Started</option>
                <option value="PAUSE_EXTENDED">Pause Extended</option>
                <option value="PAUSE_ENDED">Pause Ended</option>
                <option value="CARD_BLOCKED">Card Blocked</option>
                <option value="CARD_UNBLOCKED">Card Unblocked</option>
              </select>
              <div class="relative flex-1 max-w-xs">
                <input type="text" [(ngModel)]="changelogRollNumber" (input)="onChangelogRollInput()"
                  placeholder="Filter by roll number..."
                  class="w-full h-[36px] pl-3 pr-3 text-xs border border-[#D1D5DB] rounded-[8px] bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors" />
              </div>
            </div>
            <lib-table
              [columns]="changelogColumns"
              [data]="changelogData"
              [loading]="changelogLoading"
              [showToolbar]="false"
              [stickyActions]="false"
              [clientPagination]="false"
              [pagination]="changelogPagination"
              (onPageChange)="onChangelogPageChange($event)"
              (onItemsPerPageChange)="onChangelogSizeChange($event)"
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
  subTabs: SubTabItem[] = [
    { id: 'pause-audit', label: 'Pause Audit' },
    { id: 'anomalies', label: 'Anomaly Detector' },
    { id: 'changelog', label: 'Change Log' },
  ];
  activeTab = 'pause-audit';

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

  anomalyColumns: TableColumn[] = [
    { key: 'rollNumber', label: 'ROLL NUMBER', sortable: true, minWidth: '130px' },
    { key: 'studentName', label: 'NAME', minWidth: '160px' },
    { key: 'mealSlot', label: 'MEAL SLOT', minWidth: '110px' },
    { key: 'tapTimestamp', label: 'TIME', minWidth: '140px' },
    { key: 'reason', label: 'REASON', minWidth: '160px' },
    { key: 'severity', label: 'SEVERITY', type: 'badge', minWidth: '100px' },
  ];
  anomalyData: any[] = [];
  anomalyLoading = false;

  changelogColumns: TableColumn[] = [
    { key: 'timestamp', label: 'TIMESTAMP', sortable: true, minWidth: '170px' },
    { key: 'rollNumber', label: 'ROLL NUMBER', sortable: true, minWidth: '130px' },
    { key: 'action', label: 'ACTION', type: 'badge', sortable: true, minWidth: '130px' },
    { key: 'description', label: 'DESCRIPTION', minWidth: '300px' },
  ];
  changelogData: any[] = [];
  changelogLoading = false;
  changelogActionFilter = '';
  changelogRollNumber = '';
  changelogPage = 1;
  changelogSize = 30;
  changelogTotal = 0;
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
  }

  ngOnDestroy() {
    this.changelogRollSub?.unsubscribe();
  }

  onTabChange(tabId: string) {
    this.activeTab = tabId;
    if (tabId === 'anomalies') this.loadAnomalies();
    if (tabId === 'changelog') this.loadChangelog();
  }

  onChangelogFilterChange() {
    this.changelogPage = 1;
    this.loadChangelog();
  }

  onChangelogRollInput() {
    this.changelogRollSubject.next(this.changelogRollNumber);
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

  constructor(
    private reportsService: ReportsService,
    private cdr: ChangeDetectorRef
  ) {}

  private loadAnomalies() {
    this.anomalyLoading = true;
    this.reportsService.getAnomalies(48).subscribe({
      next: data => { this.anomalyData = data; this.anomalyLoading = false; this.cdr.detectChanges(); },
      error: () => { this.anomalyLoading = false; this.cdr.detectChanges(); }
    });
  }

  private loadChangelog() {
    this.changelogLoading = true;
    const apiPage = this.changelogPage - 1;
    this.reportsService.getChangelog({
      action: this.changelogActionFilter || undefined,
      roll_number: this.changelogRollNumber || undefined,
      page: apiPage,
      size: this.changelogSize,
    }).subscribe({
      next: res => {
        this.changelogData = (res.data || []).map((entry: any) => ({
          timestamp: entry.timestamp ? new Date(entry.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
          rollNumber: entry.rollNumber || '',
          action: entry.action || '',
          description: entry.description || '',
        }));
        this.changelogTotal = res.total || 0;
        this.changelogLoading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Failed to load changelog', err);
        this.changelogLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  runAudit() {
    this.pauseAuditLoading = true;
    this.reportsService.getPauseAudit().subscribe({
      next: data => {
        this.pauseAuditData = data;
        this.pauseAuditLoading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Pause audit failed', err);
        this.pauseAuditLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
