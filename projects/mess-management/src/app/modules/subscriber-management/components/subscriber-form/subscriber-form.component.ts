import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  HostListener,
  ChangeDetectorRef,
  ViewChild
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownLibModule } from '@libs/dropdown-lib';
import { DatePickerModule, DatePickerComponent } from '@libs/date-picker';
import { MealSlotWithCode } from '../../../../shared/services/meal-slot.service';
import { SubscriberFormService, SubscriberFormValue, ValidationErrors } from '../../../../shared/services/subscriber-form.service';

@Component({
  selector: 'app-subscriber-form',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownLibModule, DatePickerModule],
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
      this.showStatus = false;
    }
  }

  @ViewChild('subDatePicker') subDatePicker?: DatePickerComponent;
  @ViewChild('pauseDatePicker') pauseDatePicker?: DatePickerComponent;

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
      status: 'Active',
      selectedMeals: [],
      dayPreference: 'all'
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

  mealSlotsError = '';
  dateError = '';
  showStatus = false;

  dayOptions = [
    { id: 'all', label: 'All Days' },
    { id: 'weekday', label: 'Weekdays Only' },
    { id: 'weekend', label: 'Weekends Only' }
  ];

  get selectedMealSlotItems(): any[] {
    return this.mealSlots.filter(s => this.form.mealSlot.selectedMeals.includes(s.name.toLowerCase()));
  }

  get selectedDayItem(): any[] {
    return this.dayOptions.filter(d => d.id === this.form.mealSlot.dayPreference);
  }

  onMealSlotsChange(selected: any[]): void {
    this.form.mealSlot.selectedMeals = selected.map(s => s.name.toLowerCase());
    this.validateForm();
  }

  onDayPreferenceChange(selected: any[]): void {
    this.form.mealSlot.dayPreference = selected.length > 0 ? selected[0].id : 'all';
    this.validateForm();
  }

  constructor(private formService: SubscriberFormService, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    if (this.initialData) {
      this.form = { ...this.initialData };
      this.validateForm();
      setTimeout(() => this.pushDatesToDatePickers());
      this.cdr.markForCheck();
    } else {
      this.form = this.formService.initializeForm(this.mealSlots);
      this.validateForm();
      this.cdr.markForCheck();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['initialData'] || !this.initialData) return;

    this.form = { ...this.initialData! };
    this.validateForm();
    setTimeout(() => this.pushDatesToDatePickers());
    this.cdr.markForCheck();
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
    this.mealSlotsError = !this.form.mealSlot.selectedMeals.length ? 'At least one meal slot must be selected' : '';
    this.dateError = this.formService.validateDates(this.form.mealSlot.startDate, this.form.mealSlot.endDate) || '';
    const isValid = !Object.values(this.errors).some(e => e) && !this.dateError && !this.mealSlotsError;
    this.formValidChange.emit(isValid);
    return isValid;
  }

  closeAllDropdowns(): void {
    this.showStatus = false;
    if (this.subDatePicker) this.subDatePicker.isOpen = false;
    if (this.pauseDatePicker) this.pauseDatePicker.isOpen = false;
  }

  toggleStatus(e: Event): void {
    e.stopPropagation();
    this.showStatus = !this.showStatus;
  }

  private pushDatesToDatePickers(): void {
    const normalize = (d: Date | null): Date | null =>
      d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null;

    const subStart = normalize(this.subscriptionStart);
    const subEnd = normalize(this.subscriptionEnd);
    const pauseStart = normalize(this.pauseStart);
    const pauseEnd = normalize(this.pauseEnd);

    if (this.subDatePicker) {
      this.subDatePicker.confirmedStartDate = subStart;
      this.subDatePicker.confirmedEndDate = subEnd;
      this.subDatePicker.tempStartDate = subStart;
      this.subDatePicker.tempEndDate = subEnd;
      if (subStart) {
        this.subDatePicker.calendarViewDate = new Date(subStart.getFullYear(), subStart.getMonth(), 1);
      }
    }
    if (this.pauseDatePicker) {
      this.pauseDatePicker.confirmedStartDate = pauseStart;
      this.pauseDatePicker.confirmedEndDate = pauseEnd;
      this.pauseDatePicker.tempStartDate = pauseStart;
      this.pauseDatePicker.tempEndDate = pauseEnd;
      if (pauseStart) {
        this.pauseDatePicker.calendarViewDate = new Date(pauseStart.getFullYear(), pauseStart.getMonth(), 1);
      }
    }
    this.cdr.detectChanges();
  }

  // ── Date string (dd/mm/yy) ⇄ Date object helpers ──────────────────────────────
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

  // ── Initial values for the range date pickers ─────────────────────────────────
  get subscriptionStart(): Date | null {
    return this.parseDate(this.form.mealSlot.startDate);
  }

  get subscriptionEnd(): Date | null {
    return this.parseDate(this.form.mealSlot.endDate);
  }

  get pauseStart(): Date | null {
    return this.parseDate(this.form.pauseStartDate);
  }

  get pauseEnd(): Date | null {
    return this.parseDate(this.form.pauseEndDate);
  }

  // ── Range selection handlers ─────────────────────────────────────────────────
  onSubscriptionRangeSelect(range: { from: Date; to: Date | null }): void {
    this.form.mealSlot.startDate = this.formatDate(range.from);
    this.form.mealSlot.endDate = range.to ? this.formatDate(range.to) : this.formatDate(range.from);
    this.validateForm();
  }

  onSubscriptionRangeClear(): void {
    this.form.mealSlot.startDate = '';
    this.form.mealSlot.endDate = '';
    this.validateForm();
  }

  onPauseRangeSelect(range: { from: Date; to: Date | null }): void {
    this.form.pauseStartDate = this.formatDate(range.from);
    this.form.pauseEndDate = range.to ? this.formatDate(range.to) : this.formatDate(range.from);
    this.validateForm();
  }

  onPauseRangeClear(): void {
    this.form.pauseStartDate = '';
    this.form.pauseEndDate = '';
    this.validateForm();
  }
}
