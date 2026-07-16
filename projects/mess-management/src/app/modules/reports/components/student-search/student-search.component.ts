import { Component, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { API_ENDPOINTS } from '../../../../shared/constants/api-endpoints';
import { TableModule } from '@libs/table';
import { ButtonComponent } from '@libs/shared-ui';
import { debounceTime, distinctUntilChanged, Subject, switchMap, map } from 'rxjs';
import type { TableColumn, PrimaryAction } from '@libs/table';

@Component({
  selector: 'app-student-search',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TableModule, ButtonComponent],
  template: `
    <div class="flex flex-col gap-5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-sm font-semibold text-[#111827]">Student Explorer</span>
          <span class="text-[10px] text-[#6B7280]">Search and browse student records</span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="relative flex-1 max-w-md">
          <img src="assets/search icon.svg" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (input)="onSearchInput()"
            placeholder="Search by roll number or name..."
            class="w-full h-[40px] pl-9 pr-3 text-xs border border-[#D1D5DB] rounded-[8px] bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
          />
        </div>
      </div>

      <lib-table
        [columns]="columns"
        [data]="results"
        [loading]="loading"
        [showToolbar]="false"
        [stickyActions]="false"
        [clientPagination]="true"
        [pagination]="{ currentPage: 1, itemsPerPage: 20, totalItems: results.length, totalPages: 1 }"
        [primaryActions]="primaryActions"
        (onPrimaryAction)="onPrimaryAction($event)"
        [emptyTitle]="emptyTitle"
        [emptyDesc]="emptyDesc"
      ></lib-table>
    </div>
  `
})
export class StudentSearchComponent {
  @Output() viewStudent = new EventEmitter<string>();

  private baseUrl = environment.baseUrl;
  private searchSubject = new Subject<string>();

  searchQuery = '';
  results: any[] = [];
  loading = false;
  emptyTitle = 'Search for Students';
  emptyDesc = 'Enter a roll number or name to browse student records';

  columns: TableColumn[] = [
    { key: 'rollNumber', label: 'ROLL NUMBER', minWidth: '130px' },
    { key: 'displayName', label: 'SUBSCRIBER', minWidth: '200px' },
    { key: 'subscriptionStatus', label: 'STATUS', type: 'badge', minWidth: '100px',
      colorMap: { 'Active': { bg: '#155DFC33', text: '#155DFC' },
                  'Paused': { bg: '#FE9A0033', text: '#FE9A00' },
                  'Lapsed': { bg: '#FFF1F2', text: '#C70036' } } },
  ];

  primaryActions: PrimaryAction[] = [
    { type: 'view', theme: 'primary', label: 'View Report' },
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => this.searchStudents(query))
    ).subscribe(results => {
      this.results = results;
      this.loading = false;
      if (results.length === 0) {
        this.emptyTitle = 'No results found';
        this.emptyDesc = `No students matching "${this.searchQuery}"`;
      }
      this.cdr.detectChanges();
    });
  }

  onSearchInput() {
    const q = this.searchQuery.trim();
    if (q.length < 2) {
      this.results = [];
      this.emptyTitle = 'Search for Students';
      this.emptyDesc = 'Enter a roll number or name to browse student records';
      return;
    }
    this.loading = true;
    this.searchSubject.next(q);
  }

  private searchStudents(query: string) {
    return this.http.get<any>(`${this.baseUrl}${API_ENDPOINTS.STUDENTS}?search=${encodeURIComponent(query)}`)
      .pipe(map(r => {
        const data = r?.responseData?.data;
        const raw = data?.students || [];
        return raw.map((s: any) => {
          const sub = s.subscription || {};
          const now = Date.now();
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          const todayStartTs = startOfToday.getTime();
          const status = sub.pauseStart_Date && sub.pauseEnd_Date && now >= sub.pauseStart_Date && now <= sub.pauseEnd_Date
            ? 'Paused'
            : sub.end_Date && todayStartTs > sub.end_Date
              ? 'Lapsed'
              : 'Active';
          return {
            rollNumber: s.roll_number || '',
            displayName: s.name || '',
            subscriptionStatus: status,
            _raw: s,
          };
        });
      }));
  }

  onPrimaryAction(event: { actionKey: string; row: any }): void {
    const rollNumber = event.row.rollNumber || event.row.roll_number;
    this.viewStudent.emit(rollNumber);
  }

}
