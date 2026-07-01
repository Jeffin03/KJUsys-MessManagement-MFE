import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TabsModule } from '@libs/tabs';
import { ButtonComponent } from '@libs/shared-ui';
import { TableModule } from '@libs/table';
import { ReportsService } from '../../services/reports.service';
import { StudentOverview, AttendanceDay, ChangelogEntry } from '../../models/reports.models';
import type { TableColumn } from '@libs/table';

interface TabItem { id: string; label: string; subtitle?: string; count?: number; }

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TabsModule, ButtonComponent, TableModule],
  providers: [ReportsService],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex items-center gap-3">
        <button (click)="goBack()" class="w-8 h-8 rounded-lg border border-[#E5E7EB] bg-[#FAFAFB] flex items-center justify-center hover:bg-gray-100 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <div *ngIf="overview">
          <span class="text-sm font-semibold text-[#111827]">{{ overview.name }}</span>
          <span class="text-[10px] text-[#6B7280] ml-2">{{ overview.rollNumber }}</span>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-5">
        <div class="flex flex-col rounded-xl bg-white border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.05)] px-5 pt-5 pb-6">
          <div class="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span class="text-xs font-medium text-[#6B7280]">Plan</span>
          </div>
          <span class="text-xl font-bold text-[#111827]">{{ overview?.subscription?.currentPlan || '--' }}</span>
        </div>
        <div class="flex flex-col rounded-xl bg-white border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.05)] px-5 pt-5 pb-6">
          <div class="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span class="text-xs font-medium text-[#6B7280]">Status</span>
          </div>
          <span class="text-xl font-bold"
            [class.text-[#155DFC]]="overview?.subscription?.status === 'active'"
            [class.text-[#FE9A00]]="overview?.subscription?.status === 'paused'"
            [class.text-[#C70036]]="overview?.subscription?.status === 'expired'">
            {{ (overview?.subscription?.status || '--') | titlecase }}
          </span>
        </div>
        <div class="flex flex-col rounded-xl bg-white border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.05)] px-5 pt-5 pb-6">
          <div class="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <span class="text-xs font-medium text-[#6B7280]">Attendance</span>
          </div>
          <span class="text-xl font-bold text-[#111827]">{{ overview?.attendanceRate || 0 }}%</span>
        </div>
        <div class="flex flex-col rounded-xl bg-white border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.05)] px-5 pt-5 pb-6">
          <div class="flex items-center gap-2 mb-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span class="text-xs font-medium text-[#6B7280]">Card Status</span>
          </div>
          <span class="text-xl font-bold text-[#111827]">{{ overview?.cardStatus || '--' }}</span>
        </div>
      </div>

      <div class="flex flex-col bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
        <div class="border-b border-[#E5E7EB] px-6 py-4">
          <lib-tabs [tabs]="tabs" [activeTabId]="activeTab" (tabChange)="onTabChange($event)"></lib-tabs>
        </div>

        <div class="p-6">
          <div *ngIf="activeTab === 'overview'" class="grid grid-cols-2 gap-x-16 gap-y-5 text-sm">
            <div><span class="text-[#6B7280]">Start Date:</span> <span class="font-medium text-[#111827] ml-2">{{ fmtDate(overview?.subscription?.startDate) }}</span></div>
            <div><span class="text-[#6B7280]">End Date:</span> <span class="font-medium text-[#111827] ml-2">{{ fmtDate(overview?.subscription?.endDate) }}</span></div>
            <div><span class="text-[#6B7280]">Days Remaining:</span> <span class="font-medium text-[#111827] ml-2">{{ overview?.subscription?.daysRemaining }}</span></div>
            <div><span class="text-[#6B7280]">Paused Days:</span> <span class="font-medium text-[#111827] ml-2">{{ overview?.subscription?.pausedDays }}</span></div>
            <div><span class="text-[#6B7280]">Total Taps:</span> <span class="font-medium text-[#111827] ml-2">{{ overview?.totalTaps || 0 }}</span></div>
            <div><span class="text-[#6B7280]">Meal Slots:</span> <span class="font-medium text-[#111827] ml-2">{{ overview?.subscription?.mealSlots?.join(', ') || '--' }}</span></div>
          </div>

          <div *ngIf="activeTab === 'attendance'">
            <lib-table
              [columns]="attendanceColumns"
              [data]="attendanceData"
              [loading]="attendanceLoading"
              [showToolbar]="false"
              [stickyActions]="false"
              [clientPagination]="true"
              [pagination]="{ currentPage: 1, itemsPerPage: 30, totalItems: attendanceData.length, totalPages: 1 }"
            ></lib-table>
          </div>

          <div *ngIf="activeTab === 'activity'">
            <lib-table
              [columns]="activityColumns"
              [data]="activityData"
              [loading]="activityLoading"
              [showToolbar]="false"
              [stickyActions]="false"
              [clientPagination]="true"
              [pagination]="{ currentPage: 1, itemsPerPage: 20, totalItems: activityData.length, totalPages: 1 }"
            ></lib-table>
          </div>

          <div *ngIf="activeTab === 'pause-comp'">
            <div *ngIf="pauseCompLoading" class="text-xs text-[#6B7280] text-center py-8">Loading...</div>
            <div *ngIf="!pauseCompLoading && pauseCompError" class="text-xs text-[#C70036] text-center py-8">{{ pauseCompError }}</div>
            <div *ngIf="!pauseCompLoading && !pauseCompError && !pauseCompData?.hasPause" class="text-xs text-[#6B7280] text-center py-8">
              No pause records found for this student.
            </div>
            <div *ngIf="!pauseCompLoading && !pauseCompError && pauseCompData?.hasPause" class="grid grid-cols-2 gap-x-16 gap-y-5 text-sm">
              <div><span class="text-[#6B7280]">Status:</span>
                <span class="font-medium ml-2" [class.text-[#FE9A00]]="pauseCompData?.status === 'active'" [class.text-[#007A55]]="pauseCompData?.status === 'completed'">
                  {{ pauseCompData?.status === 'active' ? 'Currently Paused' : 'Completed' }}
                </span>
              </div>
              <div><span class="text-[#6B7280]">Reason:</span> <span class="font-medium text-[#111827] ml-2">{{ pauseCompData?.reason }}</span></div>
              <div><span class="text-[#6B7280]">Pause Start:</span> <span class="font-medium text-[#111827] ml-2">{{ pauseCompData?.pauseStart | date:'dd/MM/yy' }}</span></div>
              <div><span class="text-[#6B7280]">Pause End:</span> <span class="font-medium text-[#111827] ml-2">{{ pauseCompData?.pauseEnd | date:'dd/MM/yy' }}</span></div>
              <div><span class="text-[#6B7280]">Compensated Days:</span> <span class="font-medium text-[#111827] ml-2">{{ pauseCompData?.compensatedDays }}</span></div>
              <div><span class="text-[#6B7280]">Taps During Pause:</span>
                <span class="font-medium ml-2" [class.text-[#007A55]]="!pauseCompData?.tapsDuringPause" [class.text-[#C70036]]="pauseCompData?.tapsDuringPause">
                  {{ pauseCompData?.tapsDuringPause }}
                </span>
              </div>
            </div>
          </div>

          <div *ngIf="activeTab === 'history'">
            <lib-table
              [columns]="historyColumns"
              [data]="historyData"
              [loading]="historyLoading"
              [showToolbar]="false"
              [stickyActions]="false"
              [clientPagination]="true"
              [pagination]="{ currentPage: 1, itemsPerPage: 20, totalItems: historyData.length, totalPages: 1 }"
            ></lib-table>
            <div *ngIf="!historyLoading && historyData.length === 0" class="text-xs text-[#6B7280] text-center py-6">
              No subscription history found.
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StudentDetailComponent implements OnChanges {
  @Input() rollNumber = '';
  @Output() back = new EventEmitter<void>();

  overview: StudentOverview | null = null;

  fmtDate(millis: any): string {
    return millis ? new Date(millis).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '--';
  }

  tabs: TabItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'activity', label: 'Activity Log' },
    { id: 'pause-comp', label: 'Pause & Comp' },
    { id: 'history', label: 'Subscription History' },
  ];
  activeTab = 'overview';

  attendanceData: AttendanceDay[] = [];
  attendanceLoading = false;
  attendanceColumns: TableColumn[] = [
    { key: 'date', label: 'DATE', sortable: true, minWidth: '120px' },
    { key: 'overall', label: 'STATUS', type: 'badge', minWidth: '100px',
      colorMap: {
        'present': { bg: '#DCFCE7', text: '#1D9F00' },
        'partial': { bg: '#FEF3C7', text: '#BB4D00' },
        'absent': { bg: '#FFF1F2', text: '#C70036' },
        'holiday': { bg: '#F3F4F6', text: '#6B7280' },
        'paused': { bg: '#FEF3C7', text: '#FE9A00' },
      }
    },
    { key: 'mealDetails', label: 'MEALS', minWidth: '200px' },
  ];

  pauseCompData: any = null;
  pauseCompLoading = false;
  pauseCompError = '';

  activityData: ChangelogEntry[] = [];
  activityLoading = false;
  historyData: any[] = [];
  historyLoading = false;
  historyColumns: TableColumn[] = [
    { key: 'timestamp', label: 'DATE', sortable: true, minWidth: '140px' },
    { key: 'action', label: 'EVENT', type: 'badge', minWidth: '160px',
      colorMap: {
        'SUBSCRIPTION_CREATED': { bg: '#DCFCE7', text: '#1D9F00' },
        'SUBSCRIPTION_MODIFIED': { bg: '#DBEAFE', text: '#155DFC' },
        'SUBSCRIPTION_RENEWED': { bg: '#DCFCE7', text: '#1D9F00' },
        'SUBSCRIPTION_DELETED': { bg: '#FFF1F2', text: '#C70036' },
        'PAUSE_STARTED': { bg: '#FEF3C7', text: '#FE9A00' },
        'CARD_BLOCKED': { bg: '#FFF1F2', text: '#C70036' },
        'CARD_UNBLOCKED': { bg: '#DCFCE7', text: '#1D9F00' },
      }
    },
    { key: 'description', label: 'DETAILS', minWidth: '300px' },
  ];

  activityColumns: TableColumn[] = [
    { key: 'timestamp', label: 'TIME', sortable: true, minWidth: '140px' },
    { key: 'action', label: 'ACTION', type: 'badge', minWidth: '150px',
      colorMap: {
        'SUBSCRIPTION_CREATED': { bg: '#DCFCE7', text: '#1D9F00' },
        'SUBSCRIPTION_MODIFIED': { bg: '#DBEAFE', text: '#155DFC' },
        'SUBSCRIPTION_DELETED': { bg: '#FFF1F2', text: '#C70036' },
        'SUBSCRIPTION_RENEWED': { bg: '#DCFCE7', text: '#1D9F00' },
        'PAUSE_STARTED': { bg: '#FEF3C7', text: '#FE9A00' },
        'CARD_BLOCKED': { bg: '#FFF1F2', text: '#C70036' },
        'CARD_UNBLOCKED': { bg: '#DCFCE7', text: '#1D9F00' },
      }
    },
    { key: 'description', label: 'DESCRIPTION', minWidth: '250px' },
  ];

  constructor(
    private reportsService: ReportsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['rollNumber'] && this.rollNumber) {
      this.activeTab = 'overview';
      this.overview = null;
      this.pauseCompData = null;
      this.pauseCompError = '';
      this.loadOverview();
      this.loadAttendance();
      this.loadActivity();
    }
  }

  private loadOverview() {
    this.reportsService.getStudentOverview(this.rollNumber).subscribe({
      next: data => { this.overview = data; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  private loadAttendance() {
    this.attendanceLoading = true;
    this.reportsService.getStudentAttendance(this.rollNumber).subscribe({
      next: data => {
        this.attendanceData = data.map(d => ({
          ...d,
          overall: d.overall,
          mealDetails: d.mealSlots.filter(s => !s.isHoliday).map(s =>
            `${s.slotName}: ${s.tapped ? '\u2713' : '\u2717'}`
          ).join(', ')
        }));
        this.attendanceLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.attendanceLoading = false; this.cdr.detectChanges(); }
    });
  }

  private loadActivity() {
    this.activityLoading = true;
    this.reportsService.getStudentChangelog(this.rollNumber, 50).subscribe({
      next: data => {
        this.activityData = data.map(e => ({
          ...e,
          timestamp: e.timestamp ? new Date(e.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
        }));
        this.activityLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.activityLoading = false; this.cdr.detectChanges(); }
    });
  }

  onTabChange(tabId: string) {
    this.activeTab = tabId;
    if (tabId === 'pause-comp') this.loadPauseComp();
    if (tabId === 'history') this.loadHistory();
  }

  private loadHistory() {
    this.historyLoading = true;
    this.reportsService.getStudentSubscriptionHistory(this.rollNumber).subscribe({
      next: data => {
        this.historyData = data.map((e: any) => ({
          timestamp: e.timestamp ? new Date(e.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
          action: e.action,
          description: e.reason || (e.action === 'PAUSE_STARTED' ? 'Subscription paused' : 'Subscription ' + (e.action.toLowerCase())),
        }));
        this.historyLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.historyLoading = false; this.cdr.detectChanges(); }
    });
  }

  private loadPauseComp() {
    this.pauseCompLoading = true;
    this.pauseCompError = '';
    this.reportsService.getStudentPauseComp(this.rollNumber).subscribe({
      next: data => {
        this.pauseCompData = data;
        this.pauseCompLoading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.pauseCompError = 'Failed to load pause details.';
        this.pauseCompLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack() {
    this.back.emit();
  }
}
