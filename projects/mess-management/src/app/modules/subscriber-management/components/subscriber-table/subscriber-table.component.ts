import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
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

  @Output() addSubscriber = new EventEmitter<void>();
  @Output() editSubscriber = new EventEmitter<Subscriber>();
  @Output() deleteSubscriber = new EventEmitter<Subscriber>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() sizeChange = new EventEmitter<number>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() mealSlotChange = new EventEmitter<any[]>();
  @Output() statusChange = new EventEmitter<any[]>();
  @Output() exportRequest = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();

  columns: TableColumn[] = [
    {
      key: 'name',
      label: 'SUBSCRIBER',
      type: 'stacked',
      minWidth: '200px',
      subFields: [{ key: 'email', type: 'text' }],
    },
    { key: 'roll_number', label: 'ROLL NUMBER', minWidth: '130px' },
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
      },
    },
    { key: 'joinedDate', label: 'JOINED', type: 'date', minWidth: '100px' },
  ];

  primaryActions: PrimaryAction[] = [
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
  ];

  searchText = '';

  private searchSubject = new Subject<string>();
  private searchSubscription: Subscription | null = null;

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
    if (event.actionKey === 'edit') this.onEdit(event.row);
    else if (event.actionKey === 'delete') this.onDelete(event.row);
  }

  onAddSubscriber(): void {
    this.addSubscriber.emit();
  }

  onClearFilters(): void {
    this.searchText = '';
    this.clearFilters.emit();
  }

  exportCSV(): void {
    this.exportRequest.emit();
  }
}
