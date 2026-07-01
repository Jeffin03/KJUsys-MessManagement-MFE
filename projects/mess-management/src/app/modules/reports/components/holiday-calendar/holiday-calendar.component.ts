import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '@libs/shared-ui';
import { ReportsService } from '../../services/reports.service';
import { HolidayRecord } from '../../models/reports.models';

@Component({
  selector: 'app-holiday-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  providers: [ReportsService],
  template: `
    <div class="flex flex-col gap-5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-sm font-semibold text-[#111827]">Holiday Calendar</span>
          <span class="text-[10px] text-[#6B7280]">Manage mess closure dates</span>
        </div>
        <lib-button type="primary" label="Add Holiday" (onClick)="showAddForm = !showAddForm"></lib-button>
      </div>

      <div *ngIf="showAddForm" class="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <span class="text-xs font-semibold text-[#111827]">New Holiday</span>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-[10px] font-medium text-[#111827] mb-1">Date</label>
            <input type="date" (change)="onDateSelected($event)"
              class="w-full h-[40px] px-3 text-xs border border-[#D1D5DB] rounded-[8px] bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors" />
          </div>
          <div>
            <label class="block text-[10px] font-medium text-[#111827] mb-1">Reason</label>
            <input type="text" [(ngModel)]="newHolidayReason" placeholder="e.g. National Holiday"
              class="w-full h-[40px] px-3 text-xs border border-[#D1D5DB] rounded-[8px] bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors" />
          </div>
        </div>
        <div class="flex justify-end gap-3">
          <lib-button type="secondary" label="Cancel" (onClick)="showAddForm = false"></lib-button>
          <lib-button type="primary" label="Save" (onClick)="saveHoliday()" [disabled]="!newHolidayDate || !newHolidayReason"></lib-button>
        </div>
      </div>

      <div class="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <th class="text-left px-6 py-3 text-[9px] font-bold text-[#6A7282] tracking-[0.08em] uppercase">Date</th>
              <th class="text-left px-6 py-3 text-[9px] font-bold text-[#6A7282] tracking-[0.08em] uppercase">Reason</th>
              <th class="text-right px-6 py-3 text-[9px] font-bold text-[#6A7282] tracking-[0.08em] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#F3F4F6]">
            <tr *ngFor="let holiday of holidays" class="hover:bg-[#F9FAFB] transition-colors">
              <td class="px-6 py-3 text-xs font-medium text-[#1D2939]">{{ holiday.date | date:'dd MMM yyyy' }}</td>
              <td class="px-6 py-3 text-xs text-[#475467]">{{ holiday.reason }}</td>
              <td class="px-6 py-3 text-right">
                <button (click)="deleteHoliday(holiday.id)" class="text-xs font-medium text-[#C70036] hover:text-red-700 transition-colors">Delete</button>
              </td>
            </tr>
            <tr *ngIf="holidays.length === 0">
              <td colspan="3" class="px-6 py-8 text-xs text-[#6B7280] text-center">No holidays configured.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="loading" class="text-xs text-[#6B7280] text-center py-4">Loading holidays...</div>
    </div>
  `
})
export class HolidayCalendarComponent implements OnInit {
  holidays: HolidayRecord[] = [];
  loading = false;
  showAddForm = false;
  newHolidayDate: string | null = null;
  newHolidayReason = '';

  constructor(
    private reportsService: ReportsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadHolidays();
  }

  private loadHolidays() {
    this.loading = true;
    this.reportsService.getHolidays().subscribe({
      next: data => { this.holidays = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  onDateSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.newHolidayDate = input.value || null;
  }

  saveHoliday() {
    if (!this.newHolidayDate || !this.newHolidayReason) return;
    const dateMillis = new Date(this.newHolidayDate).getTime();
    this.reportsService.createHoliday(dateMillis, this.newHolidayReason).subscribe({
      next: () => {
        this.showAddForm = false;
        this.newHolidayDate = null;
        this.newHolidayReason = '';
        this.loadHolidays();
      },
      error: (err) => {
        console.error('Failed to create holiday', err);
      }
    });
  }

  deleteHoliday(id: string) {
    this.reportsService.deleteHoliday(id).subscribe({
      next: () => this.loadHolidays(),
      error: () => {}
    });
  }
}
