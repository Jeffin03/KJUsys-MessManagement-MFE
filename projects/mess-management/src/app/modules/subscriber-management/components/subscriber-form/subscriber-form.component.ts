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
  ViewChild,
  NgZone
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownLibModule } from '@libs/dropdown-lib';
import { DatePickerModule, DatePickerComponent } from '@libs/date-picker';
import { ButtonComponent } from '@libs/shared-ui';

import { MealSlotWithCode } from '../../../../shared/services/meal-slot.service';
import { SubscriberFormService, SubscriberFormValue, ValidationErrors } from '../../../../shared/services/subscriber-form.service';
import { SubscriberService } from '../../services/subscriber.service';

@Component({
  selector: 'app-subscriber-form',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownLibModule, DatePickerModule, ButtonComponent],
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
    superUser: false,
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

  showSuperUserConfirm = false;
  superUserConfirmName = '';

  formTouched = false;
  pauseTouched = false;

  presets = [
    { label: '1 Month', months: 1 },
    { label: '3 Months', months: 3 },
    { label: '6 Months', months: 6 },
    { label: '1 Year', months: 12 }
  ];
  activePreset: number | null = null;

  renewPresets = [
    { label: '1 Month', days: 30 },
    { label: '3 Months', days: 90 },
    { label: '6 Months', days: 180 },
    { label: '1 Year', days: 365 },
  ];
  activeRenewPreset = 30;
  renewDays = 30;
  renewing = false;
  renewSuccess = false;
  renewError = '';

  get isEditMode(): boolean {
    return !!this.initialData;
  }

  get renewThreshold(): number {
    if (!this.form.mealSlot.startDate || !this.form.mealSlot.endDate) return 30;
    const startTs = this.formService.parseDate(this.form.mealSlot.startDate);
    const endTs = this.formService.parseDate(this.form.mealSlot.endDate);
    if (!startTs || !endTs) return 30;
    const totalDays = Math.round((endTs - startTs) / (1000 * 60 * 60 * 24));
    return totalDays > 90 ? 30 : 15;
  }

  get daysRemaining(): number {
    if (!this.form.mealSlot.endDate) return 0;
    const endTs = this.formService.parseDate(this.form.mealSlot.endDate);
    if (!endTs) return 0;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = endTs - todayStart.getTime();
    if (diff < 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  get showRenewSection(): boolean {
    if (this.form.superUser) return false;
    if (!this.isEditMode) return false;
    const remaining = this.daysRemaining;
    return remaining < this.renewThreshold;
  }

  onRenewPresetClick(days: number): void {
    this.activeRenewPreset = days;
    this.renewDays = days;
  }

  onRenew(): void {
    if (this.renewing) return;
    this.renewing = true;
    this.renewError = '';
    this.cdr.detectChanges();
    const sub = this.subscriberService.renewSubscriber(this.form.roll_number, this.renewDays).subscribe({
      next: (res: any) => {
        this.zone.run(() => {
          this.renewing = false;
          this.renewSuccess = true;
          const newEndMillis = res?.responseData?.data?.new_end_Date;
          if (newEndMillis) {
            this.form.mealSlot.endDate = this.formatDateFromMillis(newEndMillis);
            this.pushDatesToDatePickers();
          }
          this.validateForm();
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        this.zone.run(() => {
          this.renewing = false;
          this.renewError = err?.error?.responseData?.data?.message || 'Failed to renew subscription. Please try again.';
          this.cdr.detectChanges();
        });
      }
    });
  }

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

  constructor(
    private formService: SubscriberFormService,
    private subscriberService: SubscriberService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngAfterViewInit(): void {
    if (this.initialData) {
      this.form = { ...this.initialData };
      this.validateSilently();
      setTimeout(() => this.pushDatesToDatePickers());
      this.cdr.markForCheck();
    } else {
      this.form = this.formService.initializeForm(this.mealSlots);
      this.validateSilently();
      this.cdr.markForCheck();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['initialData'] || !this.initialData) return;

    this.form = { ...this.initialData! };
    this.validateSilently();
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

  private validateSilently(): boolean {
    const rawErrors = this.formService.validateForm(this.form);
    const hasDateError = !this.form.superUser && !!this.formService.validateDates(this.form.mealSlot.startDate, this.form.mealSlot.endDate);
    const hasMealSlotsError = !this.form.superUser && !this.form.mealSlot.selectedMeals.length;
    const isValid = !Object.values(rawErrors).some(e => e) && !hasDateError && !hasMealSlotsError;
    this.formValidChange.emit(isValid);
    return isValid;
  }

  validateForm(): boolean {
    this.formTouched = true;
    this.errors = this.formService.validateForm(this.form);
    if (this.form.superUser) {
      this.mealSlotsError = '';
      this.dateError = '';
    } else {
      this.mealSlotsError = !this.form.mealSlot.selectedMeals.length ? 'At least one meal slot must be selected' : '';
      this.dateError = this.formService.validateDates(this.form.mealSlot.startDate, this.form.mealSlot.endDate) || '';
    }
    const isValid = !Object.values(this.errors).some(e => e) && !this.dateError && !this.mealSlotsError;
    this.formValidChange.emit(isValid);
    return isValid;
  }

  closeAllDropdowns(): void {
    this.showStatus = false;
    if (this.subDatePicker) this.subDatePicker.isOpen = false;
    if (this.pauseDatePicker) this.pauseDatePicker.isOpen = false;
  }

  onSuperUserToggle(): void {
    if (!this.form.superUser) {
      const name = `${this.form.firstName} ${this.form.lastName}`.trim() || 'this user';
      this.superUserConfirmName = name;
      this.showSuperUserConfirm = true;
    } else {
      this.form.superUser = false;
      this.validateForm();
    }
  }

  confirmSuperUser(): void {
    this.showSuperUserConfirm = false;
    this.form.superUser = true;
    this.form.mealSlot.selectedMeals = [];
    this.form.mealSlot.startDate = '';
    this.form.mealSlot.endDate = '';
    this.form.mealSlot.dayPreference = 'all';
    this.form.mealSlot.status = 'Active';
    this.form.pauseStartDate = '';
    this.form.pauseEndDate = '';
    this.form.pauseReason = '';
    this.validateForm();
  }

  cancelSuperUser(): void {
    this.showSuperUserConfirm = false;
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

  private formatDateFromMillis(millis: number): string {
    const d = new Date(millis);
    return this.formatDate(d);
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

  // ── Preset pill handlers ────────────────────────────────────────────────────
  onPresetClick(months: number): void {
    const today = new Date();
    const startDate = this.subscriptionStart || today;
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);

    this.form.mealSlot.startDate = this.formatDate(startDate);
    this.form.mealSlot.endDate = this.formatDate(endDate);
    this.activePreset = months;
    this.pushDatesToDatePickers();
    this.validateForm();
  }

  // ── Range selection handlers ─────────────────────────────────────────────────
  onSubscriptionRangeSelect(range: { from: Date; to: Date | null }): void {
    this.activePreset = null;
    this.form.mealSlot.startDate = this.formatDate(range.from);
    this.form.mealSlot.endDate = range.to ? this.formatDate(range.to) : this.formatDate(range.from);
    this.validateForm();
  }

  onSubscriptionRangeClear(): void {
    this.activePreset = null;
    this.form.mealSlot.startDate = '';
    this.form.mealSlot.endDate = '';
    this.validateForm();
  }

  onPauseRangeSelect(range: { from: Date; to: Date | null }): void {
    this.pauseTouched = true;
    this.form.pauseStartDate = this.formatDate(range.from);
    this.form.pauseEndDate = range.to ? this.formatDate(range.to) : this.formatDate(range.from);
    this.validateForm();
  }

  onPauseRangeClear(): void {
    this.pauseTouched = true;
    this.form.pauseStartDate = '';
    this.form.pauseEndDate = '';
    this.validateForm();
  }
}
