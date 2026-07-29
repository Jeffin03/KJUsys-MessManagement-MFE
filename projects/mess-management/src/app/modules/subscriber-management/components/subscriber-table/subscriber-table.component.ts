import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { TableModule, TableColumn, PaginationConfig, PrimaryAction } from '@libs/table';
import { ButtonComponent } from '@libs/shared-ui';
import { DropdownLibModule } from '@libs/dropdown-lib';
import { Subscriber } from '../../../../shared/models/subscriber';

@Component({
  selector: 'app-subscriber-table',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonComponent, DropdownLibModule],
  templateUrl: './subscriber-table.component.html',
  styleUrls: ['./subscriber-table.component.css'],
})
export class SubscriberTableComponent implements OnInit, OnDestroy {
  @Input() subscribers: Subscriber[] = [];
  @Input() isLoading = false;
  @Input() mealSlotList: any[] = [];
  @Input() totalItems = 0;
  @Input() currentPage = 1;
  @Input() pageSize = 10;
  @Input() clientPaginationMode = false;
  @Input() selectedMealSlots: any[] = [];
  @Input() selectedStatuses: any[] = [];
  @Input() expiryFilterDays: number | null = null;

  @Output() addSubscriber = new EventEmitter<void>();
  @Output() editSubscriber = new EventEmitter<Subscriber>();
  @Output() deleteSubscriber = new EventEmitter<Subscriber>();
  @Output() viewSubscriber = new EventEmitter<Subscriber>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() sizeChange = new EventEmitter<number>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() mealSlotChange = new EventEmitter<any[]>();
  @Output() statusChange = new EventEmitter<any[]>();
  @Output() expiryChange = new EventEmitter<number | null>();
  @Output() exportRequest = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() bulkUpload = new EventEmitter<void>();

  columns: TableColumn[] = [
    {
      key: 'name',
      label: 'SUBSCRIBER',
      type: 'stacked',
      minWidth: '200px',
      subFields: [{ key: 'hostel_name', type: 'text' }],
    },
    { key: 'admission_number', label: 'ADMISSION NUMBER', minWidth: '130px' },
    { key: 'class', label: 'CLASS', minWidth: '80px' },
    { key: 'div', label: 'SEC', minWidth: '60px' },
    { key: 'hostel_warden', label: 'WARDEN', minWidth: '120px' },
    { key: 'mealPlan', label: 'MEAL PLAN', minWidth: '110px' },
    {
      key: 'status',
      label: 'STATUS',
      type: 'badge',
      minWidth: '100px',
      colorMap: {
        'Active': { bg: '#155DFC33', text: '#155DFC' },
        'Paused': { bg: '#FE9A0033', text: '#FE9A00' },
        'Lapsed': { bg: '#FFF1F2', text: '#C70036' },
        'Super User': { bg: '#7C3AED33', text: '#7C3AED' },
      },
    },
    {
      key: 'joinedDate',
      label: 'JOINED',
      type: 'stacked',
      minWidth: '120px',
      subFields: [{ key: 'expiryWarning', type: 'text' }]
    },
  ];

  primaryActions: PrimaryAction[] = [
    { type: 'view', theme: 'secondary', label: 'View Student Details' },
    { type: 'edit', theme: 'secondary', label: 'Edit' },
    { type: 'delete', theme: 'alert', label: 'Delete' },
  ];

  get paginationConfig(): PaginationConfig {
    return {
      currentPage: this.currentPage,
      totalPages: Math.ceil(this.totalItems / this.pageSize) || 1,
      itemsPerPage: this.pageSize,
      totalItems: this.totalItems,
    };
  }

  dropdownIdField = 'name';
  dropdownTextField = 'name';

  statusData = [
    { name: 'Active' },
    { name: 'Paused' },
    { name: 'Lapsed' },
    { name: 'Super User' },
  ];

  expiryOptions = [
    { name: 'Expires in 7 days', value: 7 },
    { name: 'Expires in 15 days', value: 15 },
    { name: 'Expires in 30 days', value: 30 },
  ];

  searchText = '';
  showFilterPanel = false;
  filterSearchText = '';

  private searchSubject = new Subject<string>();
  private searchSubscription: Subscription | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(search => {
      this.searchChange.emit(search);
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  onSearchInput(value: string): void {
    const trimmed = String(value || '').trim();
    this.searchText = value;
    this.searchSubject.next(trimmed);
  }

  clearSearch(inputEl: HTMLInputElement): void {
    this.searchText = '';
    inputEl.value = '';
    this.searchSubject.next('');
    this.searchChange.emit('');
  }

  onMealSlotChange(selected: any[]): void {
    this.mealSlotChange.emit(selected);
  }

  onStatusChange(selected: any[]): void {
    this.statusChange.emit(selected);
  }

  onExpiryChange(selected: any[]): void {
    if (selected.length > 0 && selected[0].value) {
      this.expiryChange.emit(selected[0].value);
    } else {
      this.expiryChange.emit(null);
    }
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.selectedMealSlots.length > 0) count++;
    if (this.selectedStatuses.length > 0) count++;
    if (this.expiryFilterDays !== null) count++;
    return count;
  }

  isMealSlotSelected(slot: any): boolean {
    return this.selectedMealSlots.some(s => s.name === slot.name);
  }

  toggleMealSlot(slot: any): void {
    const idx = this.selectedMealSlots.findIndex(s => s.name === slot.name);
    if (idx >= 0) {
      this.selectedMealSlots.splice(idx, 1);
    } else {
      this.selectedMealSlots.push(slot);
    }
    this.mealSlotChange.emit([...this.selectedMealSlots]);
  }

  isStatusSelected(s: any): boolean {
    return this.selectedStatuses.some(st => st.name === s.name);
  }

  toggleStatus(s: any): void {
    const idx = this.selectedStatuses.findIndex(st => st.name === s.name);
    if (idx >= 0) {
      this.selectedStatuses.splice(idx, 1);
    } else {
      this.selectedStatuses.push(s);
    }
    this.statusChange.emit([...this.selectedStatuses]);
  }

  setExpiryDays(days: number | null): void {
    this.expiryChange.emit(days);
  }

  get filteredMealSlots(): any[] {
    if (!this.filterSearchText) return this.mealSlotList;
    const q = this.filterSearchText.toLowerCase();
    return this.mealSlotList.filter(s => s.name.toLowerCase().includes(q));
  }

  selectAllFilters(e: Event): void {
    e.stopPropagation();
    this.mealSlotList.forEach(slot => {
      if (!this.isMealSlotSelected(slot)) {
        this.selectedMealSlots.push(slot);
      }
    });
    this.mealSlotChange.emit([...this.selectedMealSlots]);
  }

  clearAllFilters(e: Event): void {
    e.stopPropagation();
    this.selectedMealSlots = [];
    this.selectedStatuses = [];
    this.setExpiryDays(null);
    this.mealSlotChange.emit([]);
    this.statusChange.emit([]);
  }

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }

  onSizeChange(size: number): void {
    this.sizeChange.emit(size);
  }

  onEdit(row: Subscriber): void {
    this.editSubscriber.emit(row);
  }

  onDelete(row: Subscriber): void {
    this.deleteSubscriber.emit(row);
  }

  onPrimaryAction(event: { actionKey: string; row: any }): void {
    if (event.actionKey === 'view') this.viewSubscriber.emit(event.row);
    else if (event.actionKey === 'edit') this.onEdit(event.row);
    else if (event.actionKey === 'delete') this.onDelete(event.row);
  }

  onAddSubscriber(): void {
    this.addSubscriber.emit();
  }

  onClearFilters(): void {
    this.searchText = '';
    this.showFilterPanel = false;
    this.clearFilters.emit();
  }

  toggleFilterPanel(e: Event): void {
    e.stopPropagation();
    this.showFilterPanel = !this.showFilterPanel;
    this.cdr.detectChanges();
  }

  closeFilterPanel(): void {
    this.showFilterPanel = false;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!(e.target as HTMLElement).closest('.filter-panel-wrap')) {
      this.closeFilterPanel();
    }
  }

  exportCSV(): void {
    this.exportRequest.emit();
  }

  onBulkUpload(): void {
    this.bulkUpload.emit();
  }
}
