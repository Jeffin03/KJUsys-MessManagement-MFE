import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef, HostListener, ElementRef } from '@angular/core';

@Component({
  selector: 'lib-date-picker',
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.css']
})
export class DatePickerComponent implements OnInit, OnDestroy {
  @Input() initialStartDate: Date | null = null;
  @Input() initialEndDate: Date | null = null;
  @Input() placeholder: string = 'Select Date Range';
  @Input() singleSelect: boolean = false;
  
  @Output() dateRangeSelected = new EventEmitter<{ from: Date; to: Date | null }>();
  @Output() onClear = new EventEmitter<void>();

  calendarViewDate: Date = new Date();
  
  // Current working selection
  tempStartDate: Date | null = null;
  tempEndDate: Date | null = null;
  
  // Last confirmed selection
  confirmedStartDate: Date | null = null;
  confirmedEndDate: Date | null = null;
  
  isOpen: boolean = false;
  weekdays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dropdownStyles: any = {};

  private scrollListener = (event: Event) => {
    if (this.isOpen) {
      const dropdown = this.elementRef.nativeElement.querySelector('.calendar-dropdown');
      if (dropdown && dropdown.contains(event.target)) {
        return;
      }
      this.updateDropdownPosition();
    }
  };

  constructor(private cdr: ChangeDetectorRef, private elementRef: ElementRef) {}

  ngOnInit(): void {
    // Normalize a Date to midnight to match calendar-grid dates (which are also at midnight)
    const normalize = (d: Date | null): Date | null =>
      d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null;

    this.confirmedStartDate = normalize(this.initialStartDate);
    this.confirmedEndDate   = normalize(this.initialEndDate);
    this.tempStartDate      = normalize(this.initialStartDate);
    this.tempEndDate        = normalize(this.initialEndDate);

    if (this.initialStartDate) {
      this.calendarViewDate = new Date(this.initialStartDate.getFullYear(), this.initialStartDate.getMonth(), 1);
    }

    window.addEventListener('scroll', this.scrollListener, true);
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.scrollListener, true);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.isOpen) {
        // Revert to confirmed dates when closing by clicking outside
        this.revertToConfirmed();
        this.isOpen = false;
      }
    }
  }

  @HostListener('window:resize')
  onResize() {
    if (this.isOpen) {
      this.updateDropdownPosition();
    }
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      // Sync temp with confirmed when opening
      this.tempStartDate = this.confirmedStartDate;
      this.tempEndDate = this.confirmedEndDate;
      this.updateDropdownPosition();
    }
    this.cdr.detectChanges();
  }

  getDateRangeLabel(): string {
    const start = this.isOpen ? this.tempStartDate : this.confirmedStartDate;
    const end = this.isOpen ? this.tempEndDate : this.confirmedEndDate;

    if (this.singleSelect) {
      return start ? this.formatDate(start) : this.placeholder;
    }

    if (start && end) {
      return `${this.formatDate(start)} - ${this.formatDate(end)}`;
    } else if (start) {
      return this.formatDate(start);
    }
    return this.placeholder;
  }

  formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  get calendarDays(): { day: Date | null; isCurrentMonth: boolean }[] {
    const year = this.calendarViewDate.getFullYear();
    const month = this.calendarViewDate.getMonth();
    const days: { day: Date | null; isCurrentMonth: boolean }[] = [];

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: null, isCurrentMonth: false });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push({ day: new Date(year, month, day), isCurrentMonth: true });
    }

    const remainingDays = (7 - (days.length % 7)) % 7;
    for (let i = 0; i < remainingDays; i++) {
      days.push({ day: null, isCurrentMonth: false });
    }

    return days;
  }

  prevMonth(event: Event) {
    event.stopPropagation();
    this.calendarViewDate = new Date(this.calendarViewDate.getFullYear(), this.calendarViewDate.getMonth() - 1, 1);
    this.cdr.detectChanges();
  }

  nextMonth(event: Event) {
    event.stopPropagation();
    this.calendarViewDate = new Date(this.calendarViewDate.getFullYear(), this.calendarViewDate.getMonth() + 1, 1);
    this.cdr.detectChanges();
  }

  selectDate(day: Date | null, event: Event) {
    event.stopPropagation();
    if (!day) return;
    const clickedDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());

    if (this.singleSelect) {
      this.tempStartDate = clickedDate;
      this.tempEndDate = null;
      this.confirmedStartDate = clickedDate;
      this.confirmedEndDate = null;
      this.dateRangeSelected.emit({ 
        from: this.confirmedStartDate, 
        to: null 
      });
      this.isOpen = false;
      this.cdr.detectChanges();
      return;
    }

    if (!this.tempStartDate || (this.tempStartDate && this.tempEndDate)) {
      this.tempStartDate = clickedDate;
      this.tempEndDate = null;
    } else if (clickedDate >= this.tempStartDate) {
      this.tempEndDate = clickedDate;
    } else {
      this.tempStartDate = clickedDate;
      this.tempEndDate = null;
    }
    this.cdr.detectChanges();
  }

  isSelectedStart(day: Date | null): boolean {
    return !!this.tempStartDate && !!day && this.tempStartDate.getTime() === day.getTime();
  }

  isSelectedEnd(day: Date | null): boolean {
    return !!this.tempEndDate && !!day && this.tempEndDate.getTime() === day.getTime();
  }

  isInSelectedRange(day: Date | null): boolean {
    return !!(
      this.tempStartDate &&
      this.tempEndDate &&
      day &&
      day > this.tempStartDate &&
      day < this.tempEndDate
    );
  }

  isToday(day: Date | null): boolean {
    if (!day) return false;
    const today = new Date();
    return day.getDate() === today.getDate() &&
      day.getMonth() === today.getMonth() &&
      day.getFullYear() === today.getFullYear();
  }

  clearDates(event: Event): void {
    event.stopPropagation();
    this.confirmedStartDate = null;
    this.confirmedEndDate = null;
    this.tempStartDate = null;
    this.tempEndDate = null;
    this.onClear.emit();
    this.isOpen = false;
    this.cdr.detectChanges();
  }

  confirmDates(event: Event): void {
    event.stopPropagation();
    if (this.tempStartDate) {
      this.confirmedStartDate = this.tempStartDate;
      this.confirmedEndDate = this.tempEndDate;
      this.dateRangeSelected.emit({ 
        from: this.confirmedStartDate, 
        to: this.confirmedEndDate || this.confirmedStartDate 
      });
      this.isOpen = false;
    }
  }

  private revertToConfirmed() {
    this.tempStartDate = this.confirmedStartDate;
    this.tempEndDate = this.confirmedEndDate;
  }

  updateDropdownPosition() {
    setTimeout(() => {
      const triggerEl = this.elementRef.nativeElement.querySelector('.date-picker-trigger');
      if (triggerEl) {
        const rect = triggerEl.getBoundingClientRect();
        
        let top = rect.bottom + 8;
        let left = rect.left;
        
        const dropdownWidth = 320;
        if (left + dropdownWidth > window.innerWidth) {
          left = window.innerWidth - dropdownWidth - 16;
        }
        if (left < 16) {
          left = 16;
        }

        const dropdownHeight = 350; // approximate height of the dropdown
        if (top + dropdownHeight > window.innerHeight && rect.top > dropdownHeight + 16) {
          top = rect.top - dropdownHeight - 8;
        }
        
        this.dropdownStyles = {
          position: 'fixed',
          top: `${top}px`,
          left: `${left}px`,
          width: `${rect.width}px`,
          minWidth: '320px',
          zIndex: '9999'
        };
        this.cdr.detectChanges();
      }
    }, 0);
  }
}
