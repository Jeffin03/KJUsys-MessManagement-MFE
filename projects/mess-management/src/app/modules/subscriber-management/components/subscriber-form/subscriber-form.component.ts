import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  HostListener,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MealSlotWithCode } from '../../../../shared/services/meal-slot.service';
import { SubscriberFormService, SubscriberFormValue, ValidationErrors } from '../../../../shared/services/subscriber-form.service';

@Component({
  selector: 'app-subscriber-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subscriber-form.component.html',
  styleUrls: ['./subscriber-form.component.css']
})
export class SubscriberFormComponent implements OnChanges, AfterViewInit {
  @HostListener('document:keydown.escape')
  onEscapeKey() {
    this.onCancel();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.date-picker-trigger') && !target.closest('.calendar-popup')) {
      this.showStartPicker = false;
      this.showEndPicker = false;
      this.showPauseEndPicker = false;
      this.showPauseStartPicker = false;
    }
  }

  @Input() mealSlots: MealSlotWithCode[] = [];
  @Input() initialData?: SubscriberFormValue;

  @Output() formSubmit = new EventEmitter<SubscriberFormValue>();
  @Output() formCancel = new EventEmitter<void>();
  @Output() formValidChange = new EventEmitter<boolean>();

  form: SubscriberFormValue = {
    firstName: '',
    lastName: '',
    email: '',
    roll_number: '',
    mealSlot: {
      startDate: '',
      endDate: '',
      status: 'Active'
    },
    pauseEndDate: '',
    pauseStartDate: '',
    pauseReason: ''
  };

  errors: ValidationErrors = {
    firstName: '',
    lastName: '',
    email: '',
    roll_number: '',
    pauseEndDate: '',
    pauseStartDate: '',
    pauseReason: ''
  };

  dateError = '';
  showStatus = false;

  showStartPicker = false;
  showEndPicker = false;
  showPauseEndPicker = false;
  showPauseStartPicker = false;

  popupTop = 0;
  popupLeft = 0;

  startViewDate = new Date();
  endViewDate = new Date();
  pauseEndViewDate = new Date();
  pauseStartViewDate = new Date();

  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  constructor(private formService: SubscriberFormService, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    if (this.initialData) {
      this.form = { ...this.initialData };
      this.syncViewDates();
      this.validateForm();
      this.cdr.markForCheck();
    } else if (this.mealSlots.length > 0) {
      this.form = this.formService.initializeForm(this.mealSlots);
      this.validateForm();
      this.cdr.markForCheck();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const hasInitialData = changes['initialData'] && !!this.initialData;
    const hasMealSlots = changes['mealSlots'] && this.mealSlots.length > 0;

    if (!hasInitialData && !hasMealSlots) return;

    if (hasInitialData) {
      this.form = { ...this.initialData! };
    } else if (hasMealSlots) {
      this.form = this.formService.initializeForm(this.mealSlots);
    }

    this.syncViewDates();
    this.validateForm();
    this.cdr.markForCheck();
  }

  private syncViewDates(): void {
    const start = this.parseDate(this.form.mealSlot.startDate);
    if (start) this.startViewDate = new Date(start.getFullYear(), start.getMonth(), 1);
    const end = this.parseDate(this.form.mealSlot.endDate);
    if (end) this.endViewDate = new Date(end.getFullYear(), end.getMonth(), 1);
  }

  onSubmit(): void {
    if (!this.validateForm()) return;
    this.formSubmit.emit(this.form);
  }

  onCancel(): void {
    this.closeAllDropdowns();
    this.formCancel.emit();
  }

  validateForm(): boolean {
    this.errors = this.formService.validateForm(this.form);
    this.dateError = this.formService.validateDates(this.form.mealSlot.startDate, this.form.mealSlot.endDate) || '';
    const isValid = !Object.values(this.errors).some(e => e) && !this.dateError;
    this.formValidChange.emit(isValid);
    return isValid;
  }

  closeAllDropdowns(): void {
    this.showStartPicker = false;
    this.showEndPicker = false;
    this.showPauseEndPicker = false;
    this.showPauseStartPicker = false;
    this.showStatus = false;
  }

  toggleStatus(e: Event): void {
    e.stopPropagation();
    this.showStatus = !this.showStatus;
    this.showStartPicker = false;
    this.showEndPicker = false;
    this.showPauseEndPicker = false;
    this.showPauseStartPicker = false;
  }

  togglePicker(type: 'start' | 'end' | 'pauseEnd' | 'pauseStart', e: Event): void {
    e.stopPropagation();
    const alreadyOpen = type === 'start' ? this.showStartPicker : (type === 'end' ? this.showEndPicker : (type === 'pauseEnd' ? this.showPauseEndPicker : this.showPauseStartPicker));
    if (alreadyOpen) {
      this.showStartPicker = false;
      this.showEndPicker = false;
      this.showPauseEndPicker = false;
      this.showPauseStartPicker = false;
      return;
    }
    this.showStartPicker = false;
    this.showEndPicker = false;
    this.showPauseEndPicker = false;
    this.showPauseStartPicker = false;
    this.showStatus = false;

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const popupWidth = 300;
    const popupHeight = 340;

    let top = rect.bottom + 8;
    let left = rect.left;

    if (top + popupHeight > window.innerHeight) {
      top = Math.max(8, rect.top - popupHeight - 8);
    }
    if (left + popupWidth > window.innerWidth) {
      left = Math.max(8, window.innerWidth - popupWidth - 16);
    }

    this.popupTop = top;
    this.popupLeft = left;

    if (type === 'start') {
      const d = this.parseDate(this.form.mealSlot.startDate);
      if (d) this.startViewDate = new Date(d.getFullYear(), d.getMonth(), 1);
      this.showStartPicker = true;
    } else if (type === 'end') {
      const d = this.parseDate(this.form.mealSlot.endDate);
      if (d) this.endViewDate = new Date(d.getFullYear(), d.getMonth(), 1);
      this.showEndPicker = true;
    } else if (type === 'pauseEnd') {
      this.showPauseEndPicker = true;
    } else {
      const d = this.parseDate(this.form.pauseStartDate);
      if (d) this.pauseStartViewDate = new Date(d.getFullYear(), d.getMonth(), 1);
      this.showPauseStartPicker = true;
    }
  }

  prevMonth(type: 'start' | 'end' | 'pauseEnd' | 'pauseStart'): void {
    const d = type === 'start' ? this.startViewDate : (type === 'end' ? this.endViewDate : (type === 'pauseEnd' ? this.pauseEndViewDate : this.pauseStartViewDate));
    const nd = new Date(d.getFullYear(), d.getMonth() - 1, 1);
    if (type === 'start') this.startViewDate = nd;
    else if (type === 'end') this.endViewDate = nd;
    else if (type === 'pauseEnd') this.pauseEndViewDate = nd;
    else this.pauseStartViewDate = nd;
  }

  nextMonth(type: 'start' | 'end' | 'pauseEnd' | 'pauseStart'): void {
    const d = type === 'start' ? this.startViewDate : (type === 'end' ? this.endViewDate : (type === 'pauseEnd' ? this.pauseEndViewDate : this.pauseStartViewDate));
    const nd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    if (type === 'start') this.startViewDate = nd;
    else if (type === 'end') this.endViewDate = nd;
    else if (type === 'pauseEnd') this.pauseEndViewDate = nd;
    else this.pauseStartViewDate = nd;
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

  isInRange(day: Date | null): boolean {
    if (!day) return false;
    const start = this.parseDate(this.form.mealSlot.startDate);
    const end = this.parseDate(this.form.mealSlot.endDate);
    if (!start || !end) return false;
    return day > start && day < end;
  }

  isBoundaryDate(day: Date | null): boolean {
    if (!day) return false;
    const fmt = this.formatDate(day);
    return fmt === this.form.mealSlot.startDate || fmt === this.form.mealSlot.endDate;
  }

  isBoundaryStart(day: Date | null): boolean {
    if (!day) return false;
    return this.formatDate(day) === this.form.mealSlot.startDate;
  }

  isBoundaryEnd(day: Date | null): boolean {
    if (!day) return false;
    return this.formatDate(day) === this.form.mealSlot.endDate;
  }

  isRangeStart(day: Date | null): boolean {
    if (!day) return false;
    const start = this.parseDate(this.form.mealSlot.startDate);
    if (!start) return false;
    return day.getTime() === start.getTime();
  }

  isRangeEnd(day: Date | null): boolean {
    if (!day) return false;
    const end = this.parseDate(this.form.mealSlot.endDate);
    if (!end) return false;
    return day.getTime() === end.getTime();
  }

  isCurrentMonth(day: Date, viewDate: Date): boolean {
    return day.getMonth() === viewDate.getMonth();
  }

  isToday(day: Date | null): boolean {
    if (!day) return false;
    const today = new Date();
    return day.getFullYear() === today.getFullYear() &&
           day.getMonth() === today.getMonth() &&
           day.getDate() === today.getDate();
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
    this.validateForm();
  }

  confirmDate(type: 'start' | 'end'): void {
    if (type === 'start') this.showStartPicker = false;
    else this.showEndPicker = false;
    this.validateForm();
  }

  isSelectedPauseEnd(day: Date | null): boolean {
    if (!day) return false;
    return this.form.pauseEndDate === this.formatDate(day);
  }

  isPauseInRange(day: Date | null): boolean {
    if (!day) return false;
    const end = this.parseDate(this.form.pauseEndDate);
    if (!end) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return day > today && day < end;
  }

  isPauseRangeStart(day: Date | null): boolean {
    if (!day) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return day.getTime() === today.getTime();
  }

  isPauseRangeEnd(day: Date | null): boolean {
    if (!day) return false;
    return this.formatDate(day) === this.form.pauseEndDate;
  }

  selectPauseEndDay(day: Date | null): void {
    if (!day) return;
    this.form.pauseEndDate = this.formatDate(day);
    this.showPauseEndPicker = false;
    this.validateForm();
  }

  clearPauseEndDate(): void {
    this.form.pauseEndDate = '';
    this.showPauseEndPicker = false;
    this.validateForm();
  }

  confirmPauseEndDate(): void {
    this.showPauseEndPicker = false;
    this.validateForm();
  }

  isPauseStartBoundaryDate(day: Date | null): boolean {
    if (!day) return false;
    const fmt = this.formatDate(day);
    return fmt === this.form.pauseStartDate || fmt === this.form.pauseEndDate;
  }

  isPauseStartInRange(day: Date | null): boolean {
    if (!day) return false;
    const start = this.parseDate(this.form.pauseStartDate);
    const end = this.parseDate(this.form.pauseEndDate);
    if (!start || !end) return false;
    return day > start && day < end;
  }

  isPauseStartBoundaryStart(day: Date | null): boolean {
    if (!day) return false;
    return this.formatDate(day) === this.form.pauseStartDate;
  }

  isPauseStartBoundaryEnd(day: Date | null): boolean {
    if (!day) return false;
    return this.formatDate(day) === this.form.pauseEndDate;
  }

  selectPauseStartDay(day: Date | null): void {
    if (!day) return;
    this.form.pauseStartDate = this.formatDate(day);
    this.showPauseStartPicker = false;
    this.validateForm();
  }

  clearPauseStartDate(): void {
    this.form.pauseStartDate = '';
    this.showPauseStartPicker = false;
    this.validateForm();
  }

  confirmPauseStartDate(): void {
    this.showPauseStartPicker = false;
    this.validateForm();
  }

  private parseDate(str: string): Date | null {
    if (!str) return null;
    const [dd, mm, yy] = str.split('/').map(Number);
    if (!dd || !mm || yy === undefined) return null;
    return new Date(2000 + yy, mm - 1, dd);
  }

  stringToDate(str: string): Date | null {
    return this.parseDate(str);
  }

  private formatDate(d: Date): string {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  }
}
