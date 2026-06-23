import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  HostListener,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Subscriber } from '../../../../shared/models/subscriber';
import { DashboardService } from '../../../dashboard/services/dashboard.service';
import { ButtonComponent } from '@libs/shared-ui';
import { SubscriberService } from '../../services/subscriber.service';

@Component({
  selector: 'app-edit-subscriber-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './edit-subscriber-modal.component.html',
  styleUrls: ['./edit-subscriber-modal.component.css']
})
export class EditSubscriberModalComponent implements OnChanges, OnDestroy {

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.isOpen) {
      this.onClose();
    }
  }

  constructor(private dashboardService: DashboardService, private cdr: ChangeDetectorRef, private subscriberService: SubscriberService) {}

  @Input() isOpen = false;
  @Input() subscriber: Subscriber | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() update = new EventEmitter<any>();
  @Output() next = new EventEmitter<any>();

  errors = {
    firstName: '',
    lastName: '',
    email: '',
    roll_number: '',
    pauseEndDate: ''
  };

  dateError = '';

  showStartPicker = false;
  showEndPicker = false;
  showStatus = false;
  showPauseEndPicker = false;

  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  startViewDate = new Date();
  endViewDate = new Date();
  pauseEndViewDate = new Date();

  availableMealSlots: string[] = [];

  form = {
    firstName: '',
    lastName: '',
    email: '',
    roll_number: '',
    mealSlot: {
      startDate: '',
      endDate: '',
      status: ''
    } as any,
    pauseEndDate: ''
  } as any;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['isOpen'] && !changes['subscriber']) return;

    if (this.isOpen) {
      this.fetchMealSlots();
    } else {
      if (this.subscriber) {
        this.populateForm();
      }
    }

    const appRoot = document.querySelector('app-root') as HTMLElement;
    if (this.isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      if (appRoot) {
        appRoot.style.height = '100vh';
        appRoot.style.overflow = 'hidden';
      }
    } else {
      this.unlockScroll();
    }
  }

  fetchMealSlots() {
    this.dashboardService.getSchedules(true).subscribe({
      next: (slots: any) => {
        this.availableMealSlots = slots.map((s: any) => s.name);
        if (this.subscriber) {
          this.populateForm();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch meal schedules', err);
      }
    });
  }

  ngOnDestroy(): void {
    this.unlockScroll();
  }

  private unlockScroll(): void {
    const appRoot = document.querySelector('app-root') as HTMLElement;
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    if (appRoot) {
      appRoot.style.height = '';
      appRoot.style.overflow = '';
    }
  }

  private populateForm(): void {
    if (!this.subscriber) return;

    // Split name into first and last name (assuming format "First Last")
    const nameParts = this.subscriber.name.split(' ');
    this.form.firstName = nameParts[0] || '';
    this.form.lastName = nameParts.slice(1).join(' ') || '';

    this.form.email = this.subscriber.email || '';
    this.form.roll_number = this.subscriber.roll_number !== 'N/A' ? this.subscriber.roll_number : '';

    // Parse meal plan from subscriber
    const plan = (this.subscriber.mealPlan || '').toUpperCase().split('+');

    this.availableMealSlots.forEach(slot => {
      const slotUpper = slot.toUpperCase();
      let matched = false;
      if (slotUpper === 'BREAKFAST' && plan.includes('B')) matched = true;
      else if (slotUpper === 'BRUNCH' && plan.includes('BR')) matched = true;
      else if (slotUpper === 'LUNCH' && plan.includes('L')) matched = true;
      else if (slotUpper === 'SNACKS' && plan.includes('S')) matched = true;
      else if (slotUpper === 'DINNER' && plan.includes('D')) matched = true;
      else if (plan.includes(slotUpper)) matched = true;

      this.form.mealSlot[slot.toLowerCase()] = matched;
    });

    // Status
    this.form.mealSlot.status = this.subscriber.status || 'Active';

    // Pause end date
    if (this.subscriber.pauseEndDate) {
      this.form.pauseEndDate = this.subscriber.pauseEndDate;
    } else {
      this.form.pauseEndDate = '';
    }

    // Use startDate and endDate from subscriber if available (formatted as DD/MM/YY)
    // Otherwise, fallback to calculating from joinedDate (should not happen with updated service)
    if (this.subscriber.startDate && this.subscriber.endDate) {
      this.form.mealSlot.startDate = this.subscriber.startDate;
      this.form.mealSlot.endDate = this.subscriber.endDate;
    } else {
      // Fallback: parse joinedDate (this should only happen if data comes from old service)
      const dateStr = this.subscriber.joinedDate;
      if (dateStr) {
        const parts = dateStr.split(' ');
        if (parts.length >= 3) {
          const d = parts[0].padStart(2, '0');
          const monthIndex = this.months.findIndex(month => month.toLowerCase().startsWith(parts[1].toLowerCase()));
          const m = (monthIndex >= 0 ? monthIndex + 1 : 1).toString().padStart(2, '0');
          const y = parts[2].slice(-2);
          this.form.mealSlot.startDate = `${d}/${m}/${y}`;

          let mNum = parseInt(m, 10);
          let yNum = parseInt(y, 10);
          mNum++;
          if (mNum > 12) {
            mNum = 1;
            yNum++;
          }
          this.form.mealSlot.endDate = `${d}/${mNum.toString().padStart(2, '0')}/${yNum.toString().padStart(2, '0')}`;
        } else {
          this.form.mealSlot.startDate = '';
          this.form.mealSlot.endDate = '';
        }
      } else {
        this.form.mealSlot.startDate = '';
        this.form.mealSlot.endDate = '';
      }
    }
    this.cdr.detectChanges();
  }

  onClose(): void {
    this.closeAllDropdowns();
    this.unlockScroll();
    this.resetForm();
    this.close.emit();
  }

  resetForm(): void {
    this.form = {
      firstName: '',
      lastName: '',
      email: '',
      roll_number: '',
      mealSlot: {
        startDate: '',
        endDate: '',
        status: ''
      } as any,
      pauseEndDate: ''
    };

    this.availableMealSlots.forEach(slot => {
      this.form.mealSlot[slot.toLowerCase()] = false;
    });
    this.errors = {
      firstName: '',
      lastName: '',
      email: '',
      roll_number: '',
      pauseEndDate: ''
    };
    this.dateError = '';
    this.cdr.detectChanges();
  }

  onUpdate(): void {
    this.update.emit(this.form);
  }

  onNext(): void {
    if (!this.validateForm()) return;
    console.log('Form Valid');
    this.next.emit(this.form);
  }

  validateForm(): boolean {
    this.errors = {
      firstName: '',
      lastName: '',
      email: '',
      roll_number: '',
      pauseEndDate: ''
    };

    const nameRegex = /^[A-Za-z ]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let valid = true;

    if (!this.form.firstName.trim()) {
      this.errors.firstName = 'First name is required';
      valid = false;
    } else if (!nameRegex.test(this.form.firstName)) {
      this.errors.firstName = 'Only letters are allowed';
      valid = false;
    }

    if (!this.form.lastName.trim()) {
      this.errors.lastName = 'Last name is required';
      valid = false;
    } else if (!nameRegex.test(this.form.lastName)) {
      this.errors.lastName = 'Only letters are allowed';
      valid = false;
    }

    if (!emailRegex.test(this.form.email)) {
      this.errors.email = 'Invalid email address';
      valid = false;
    }

    if (!this.form.roll_number.trim()) {
      this.errors.roll_number = 'Roll number is required';
      valid = false;
    }

    this.validateDates();
    if (this.dateError) valid = false;

    // Validate pause end date when status is Paused
    if (this.form.mealSlot.status === 'Paused') {
      const pauseEndDate = (this.form as any).pauseEndDate;
      if (!pauseEndDate || !pauseEndDate.trim()) {
        this.errors.pauseEndDate = 'Pause end date is required when status is Paused';
        valid = false;
      }
    }

    this.cdr.detectChanges();
    return valid;
  }

  validateDates(): void {
    const start = this.form.mealSlot.startDate;
    const end = this.form.mealSlot.endDate;

    if (!start || !end) {
      this.dateError = '';
      return;
    }

    const [sd, sm, sy] = start.split('/').map(Number);
    const [ed, em, ey] = end.split('/').map(Number);

    const startDate = new Date(2000 + sy, sm - 1, sd);
    const endDate = new Date(2000 + ey, em - 1, ed);

    if (startDate.getTime() === endDate.getTime()) {
      this.dateError = 'Start and end date cannot be the same';
    } else if (endDate < startDate) {
      this.dateError = 'End date cannot be earlier than start date';
    } else {
      this.dateError = '';
    }
  }

  closeAllDropdowns(): void {
    this.showStartPicker = false;
    this.showEndPicker = false;
    this.showStatus = false;
    this.showPauseEndPicker = false;
  }

  togglePicker(type: 'start' | 'end' | 'pauseEnd', e: Event): void {
    e.stopPropagation();
    if (type === 'start') {
      this.showStartPicker = !this.showStartPicker;
      this.showEndPicker = false;
      this.showPauseEndPicker = false;
    } else if (type === 'end') {
      this.showEndPicker = !this.showEndPicker;
      this.showStartPicker = false;
      this.showPauseEndPicker = false;
    } else {
      this.showPauseEndPicker = !this.showPauseEndPicker;
      this.showStartPicker = false;
      this.showEndPicker = false;
    }
    this.showStatus = false;
  }

  toggleStatus(e: Event): void {
    e.stopPropagation();
    this.showStatus = !this.showStatus;
    this.showStartPicker = false;
    this.showEndPicker = false;
  }

  prevMonth(type: 'start' | 'end' | 'pauseEnd'): void {
    const d = type === 'start' ? this.startViewDate : (type === 'end' ? this.endViewDate : this.pauseEndViewDate);
    const nd = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    if (type === 'start') this.startViewDate = nd;
    else if (type === 'end') this.endViewDate = nd;
    else this.pauseEndViewDate = nd;
  }

  nextMonth(type: 'start' | 'end' | 'pauseEnd'): void {
    const d = type === 'start' ? this.startViewDate : (type === 'end' ? this.endViewDate : this.pauseEndViewDate);
    const nd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    if (type === 'start') this.startViewDate = nd;
    else if (type === 'end') this.endViewDate = nd;
    else this.pauseEndViewDate = nd;
  }

  getCalendarDays(viewDate: Date): (Date | null)[] {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }

  isSelected(type: 'start' | 'end', day: Date | null): boolean {
    if (!day) return false;
    const value = type === 'start' ? this.form.mealSlot.startDate : this.form.mealSlot.endDate;
    return value === this.formatDate(day);
  }

  isCurrentMonth(day: Date, viewDate: Date): boolean {
    return day.getMonth() === viewDate.getMonth();
  }

  selectDay(type: 'start' | 'end', day: Date | null): void {
    if (!day) return;
    if (type === 'start') this.form.mealSlot.startDate = this.formatDate(day);
    else this.form.mealSlot.endDate = this.formatDate(day);
  }

  clearDate(type: 'start' | 'end'): void {
    if (type === 'start') {
      this.form.mealSlot.startDate = '';
      this.showStartPicker = false;
    } else {
      this.form.mealSlot.endDate = '';
      this.showEndPicker = false;
    }
    this.dateError = '';
  }

  confirmDate(type: 'start' | 'end'): void {
    if (type === 'start') this.showStartPicker = false;
    else this.showEndPicker = false;
    this.validateDates();
  }

  isSelectedPauseEnd(day: Date | null): boolean {
    if (!day) return false;
    return this.form.pauseEndDate === this.formatDate(day);
  }

  clearPauseEndDate(): void {
    this.form.pauseEndDate = '';
    this.showPauseEndPicker = false;
  }

  confirmPauseEndDate(): void {
    this.showPauseEndPicker = false;
  }

  selectPauseEndDay(day: Date | null): void {
    if (!day) return;
    this.form.pauseEndDate = this.formatDate(day);
    this.showPauseEndPicker = false;
  }

  private formatDate(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  }
}