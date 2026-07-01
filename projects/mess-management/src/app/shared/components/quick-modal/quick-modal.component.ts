import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { API_ENDPOINTS } from '../../constants/api-endpoints';
import { ButtonComponent } from '@libs/shared-ui';

interface QuickStudent {
  name: string;
  rollNumber: string;
  plan: string;
  status: string;
  cardStatus: string;
  attendanceRate: number;
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-quick-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div *ngIf="visible" class="fixed inset-0 bg-black/55 z-[1000] flex items-center justify-center p-4" (click)="close.emit()">
      <div class="bg-white rounded-[14px] w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-[0_24px_64px_rgba(0,0,0,0.18)]" (click)="$event.stopPropagation()">
        <div class="flex items-start justify-between px-7 pt-6 pb-[18px] border-b border-gray-200">
          <span class="text-sm font-semibold text-[#111827]">Student Quick View</span>
          <button (click)="close.emit()" class="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
        </div>

        <div class="px-7 py-5">
          <div *ngIf="loading" class="py-8 text-center text-xs text-[#6B7280]">Loading...</div>
          <div *ngIf="error" class="py-8 text-center text-xs text-[#C70036]">{{ error }}</div>
          <div *ngIf="!loading && !error && student" class="space-y-5">
            <div class="flex items-center gap-4">
              <div class="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold flex-shrink-0">
                {{ student.name.charAt(0) || '?' }}
              </div>
              <div>
                <p class="text-sm font-semibold text-[#111827]">{{ student.name }}</p>
                <p class="text-[11px] text-[#6B7280]">{{ student.rollNumber }}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 text-xs">
              <div class="flex flex-col gap-1 bg-[#FAFAFB] rounded-lg px-3 py-2.5">
                <span class="text-[#6B7280]">Plan</span>
                <span class="font-semibold text-[#111827]">{{ student.plan }}</span>
              </div>
              <div class="flex flex-col gap-1 bg-[#FAFAFB] rounded-lg px-3 py-2.5">
                <span class="text-[#6B7280]">Status</span>
                <span class="font-semibold"
                  [class.text-[#155DFC]]="student.status === 'active'"
                  [class.text-[#FE9A00]]="student.status === 'paused'"
                  [class.text-[#C70036]]="student.status === 'expired'">{{ student.status | titlecase }}</span>
              </div>
              <div class="flex flex-col gap-1 bg-[#FAFAFB] rounded-lg px-3 py-2.5">
                <span class="text-[#6B7280]">Card</span>
                <span class="font-semibold text-[#111827]">{{ student.cardStatus }}</span>
              </div>
              <div class="flex flex-col gap-1 bg-[#FAFAFB] rounded-lg px-3 py-2.5">
                <span class="text-[#6B7280]">Attendance</span>
                <span class="font-semibold text-[#111827]">{{ student.attendanceRate }}%</span>
              </div>
            </div>

            <div class="flex items-center gap-6 text-xs text-[#6B7280]">
              <span>From: <span class="font-medium text-[#111827]">{{ student.startDate }}</span></span>
              <span>To: <span class="font-medium text-[#111827]">{{ student.endDate }}</span></span>
            </div>
          </div>
          <div *ngIf="!loading && !error && !student" class="py-6 text-center text-xs text-[#6B7280]">
            No student data available.
          </div>
        </div>

        <div class="flex items-center justify-between px-7 py-4 border-t border-gray-200">
          <lib-button type="secondary" label="Close" (onClick)="close.emit()"></lib-button>
          <lib-button type="primary" label="View Full Report" (onClick)="viewFullReport()"></lib-button>
        </div>
      </div>
    </div>
  `
})
export class QuickModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() rollNumber: string | null = null;
  @Output() close = new EventEmitter<void>();

  private baseUrl = environment.baseUrl;
  student: QuickStudent | null = null;
  loading = false;
  error = '';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible'] && this.visible && this.rollNumber) {
      this.loadStudent();
    }
    if (changes['rollNumber'] && this.visible && this.rollNumber) {
      this.loadStudent();
    }
  }

  viewFullReport() {
    this.close.emit();
    this.router.navigate(['/kjusys/mess-management/reports'], {
      queryParams: { student: this.rollNumber }
    });
  }

  private loadStudent() {
    if (!this.rollNumber) return;
    this.loading = true;
    this.error = '';
    this.student = null;
    this.cdr.detectChanges();

    this.http.get<any>(`${this.baseUrl}${API_ENDPOINTS.STUDENT_BY_ROLL_NUMBER(this.rollNumber)}`).subscribe({
      next: res => {
        const raw = res?.responseData?.data;
        const s = raw?.student || raw;
        const sub = s?.subscription || {};
        const meals: string[] = sub.meals || [];
        const mealSlots = meals.map((m: string) => m.charAt(0) + m.slice(1).toLowerCase());

        const now = Date.now();
        const status = sub.pauseStart_Date && sub.pauseEnd_Date && now >= sub.pauseStart_Date && now <= sub.pauseEnd_Date
          ? 'paused'
          : sub.end_Date && now > sub.end_Date
            ? 'expired'
            : 'active';

        this.student = {
          name: s?.name || '',
          rollNumber: s?.roll_number || '',
          plan: mealSlots.join(' + ') || 'None',
          status,
          cardStatus: s?.card_blocked ? 'Blocked' : 'Active',
          attendanceRate: 0,
          startDate: sub.start_Date
            ? new Date(sub.start_Date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : '--',
          endDate: sub.end_Date
            ? new Date(sub.end_Date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : '--',
        };
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.error = 'Failed to load student details.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
