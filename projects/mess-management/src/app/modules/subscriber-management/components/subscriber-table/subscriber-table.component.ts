import { Component, Input, Output, EventEmitter, OnChanges, HostListener, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { Subscriber } from '../../../../shared/models/subscriber';
import { ButtonComponent } from '@libs/shared-ui';

@Component({
  selector: 'app-subscriber-table',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './subscriber-table.component.html',
})
export class SubscriberTableComponent implements OnInit, OnChanges, OnDestroy {
  @Input() subscribers: Subscriber[] = [];
  @Input() totalCount = 0;
  @Input() currentPage = 1;
  @Input() pageSize = 14;
  @Input() isLoading = false;
  @Input() searchTerm = '';
  @Input() selectedPlan = '';
  @Input() selectedStatus = '';

  @Output() addSubscriber = new EventEmitter<void>();
  @Output() editSubscriber = new EventEmitter<Subscriber>();
  @Output() deleteSubscriber = new EventEmitter<Subscriber>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<{ plan: string; status: string }>();
  @Output() pageChange = new EventEmitter<number>();

  constructor(private elementRef: ElementRef) { }

  showPlanDropdown = false;
  showStatusDropdown = false;

  private searchSubject = new Subject<string>();
  private searchSubscription: Subscription = new Subscription();

  planOptions = [
    { value: 'B+L+D', label: 'B+L+D' },
    { value: 'B+L', label: 'B+L' },
    { value: 'B+D', label: 'B+D' },
    { value: 'L+D', label: 'L+D' },
    { value: 'B', label: 'B' },
    { value: 'L', label: 'L' },
    { value: 'D', label: 'D' },
  ];

  statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Paused', label: 'Paused' },
    { value: 'Lapsed', label: 'Lapsed' },
  ];

  get totalPages(): number { return Math.ceil(this.totalCount / this.pageSize); }
  get totalPagesArray(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
  get pageStart(): number { return (this.currentPage - 1) * this.pageSize + 1; }
  get pageEnd(): number { return Math.min(this.currentPage * this.pageSize, this.totalCount); }

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchChange.emit(term);
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  ngOnChanges(): void {}

  onSearchInput(): void {
    this.searchSubject.next(this.searchTerm);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.showPlanDropdown = false;
    this.showStatusDropdown = false;
  }

  togglePlanDropdown(event: MouseEvent) {
    event.stopPropagation();
    const wasOpen = this.showPlanDropdown;
    this.showPlanDropdown = false;
    this.showStatusDropdown = false;
    this.showPlanDropdown = !wasOpen;
  }

  toggleStatusDropdown(event: MouseEvent) {
    event.stopPropagation();
    const wasOpen = this.showStatusDropdown;
    this.showPlanDropdown = false;
    this.showStatusDropdown = false;
    this.showStatusDropdown = !wasOpen;
  }

  selectPlan(value: string, event: MouseEvent) {
    event.stopPropagation();
    this.selectedPlan = value;
    this.showPlanDropdown = false;
    this.emitFilters();
  }

  selectStatus(value: string, event: MouseEvent) {
    event.stopPropagation();
    this.selectedStatus = value;
    this.showStatusDropdown = false;
    this.emitFilters();
  }

  get selectedPlanLabel(): string {
    return this.planOptions.find(p => p.value === this.selectedPlan)?.label || 'All Plans';
  }

  get selectedStatusLabel(): string {
    return this.statusOptions.find(s => s.value === this.selectedStatus)?.label || 'All Status';
  }

  onSearch(): void {
    this.searchChange.emit(this.searchTerm);
  }

  onFilter(): void {
    this.emitFilters();
  }

  private emitFilters(): void {
    this.filterChange.emit({ plan: this.selectedPlan, status: this.selectedStatus });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active': return 'bg-[#F0FDF4] text-[#007A55]';
      case 'Paused': return 'bg-[#FEF3C7] text-[#BB4D00]';
      case 'Lapsed': return 'bg-[#FFF1F2] text-[#C70036]';
      default: return '';
    }
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) {
      this.pageChange.emit(p);
    }
  }

  prevPage(): void { if (this.currentPage > 1) this.pageChange.emit(this.currentPage - 1); }
  nextPage(): void { if (this.currentPage < this.totalPages) this.pageChange.emit(this.currentPage + 1); }

  onAddSubscriber(): void { this.addSubscriber.emit(); }
  onEdit(sub: Subscriber): void { this.editSubscriber.emit(sub); }
  onDelete(sub: Subscriber): void { this.deleteSubscriber.emit(sub); }
}