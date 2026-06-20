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

  constructor(private dashboardService: DashboardService, private cdRef: ChangeDetectorRef) {}

  @Input() isOpen = false;
  @Input() subscriber: Subscriber | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() update = new EventEmitter<any>();
  @Output() next = new EventEmitter<any>();

  errors = {
    firstName: '',
    lastName: '',
    email: '',
    roll_number: ''
  };

  dateError = '';

  showStartPicker = false;
  showEndPicker = false;
  showStatus = false;

  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  startViewDate = new Date();
  endViewDate = new Date();

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
    } as any
  };

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
    this.dashboardService.getSchedules().subscribe((slots: any) => {
      this.availableMealSlots = slots.map((s: any) => s.name);
      if (this.subscriber) {
        this.populateForm();
      }
      this.cdRef.detectChanges();
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

    // Parse joinedDate into startDate and calculate a mock endDate
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
      } as any
    };
    
    this.availableMealSlots.forEach(slot => {
      this.form.mealSlot[slot.toLowerCase()] = false;
    });
    this.errors = {
      firstName: '',
      lastName: '',
      email: '',
      roll_number: ''
    };
    this.dateError = '';
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
      roll_number: ''
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
  }

  togglePicker(type: 'start' | 'end', e: Event): void {
    e.stopPropagation();
    if (type === 'start') {
      this.showStartPicker = !this.showStartPicker;
      this.showEndPicker = false;
    } else {
      this.showEndPicker = !this.showEndPicker;
      this.showStartPicker = false;
    }
    this.showStatus = false;
  }

  toggleStatus(e: Event): void {
    e.stopPropagation();
    this.showStatus = !this.showStatus;
    this.showStartPicker = false;
    this.showEndPicker = false;
  }

  prevMonth(type: 'start' | 'end'): void {
    const d = type === 'start' ? this.startViewDate : this.endViewDate;
    const nd = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    if (type === 'start') this.startViewDate = nd;
    else this.endViewDate = nd;
  }

  nextMonth(type: 'start' | 'end'): void {
    const d = type === 'start' ? this.startViewDate : this.endViewDate;
    const nd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    if (type === 'start') this.startViewDate = nd;
    else this.endViewDate = nd;
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

  private formatDate(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  }
}