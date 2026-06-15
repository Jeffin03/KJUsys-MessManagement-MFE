import { Component, Input, Output, EventEmitter, OnChanges, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscriber } from '../../../../shared/models/subscriber';

@Component({
  selector: 'app-subscriber-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subscriber-table.component.html',
})
export class SubscriberTableComponent implements OnChanges {
  @Input() subscribers: Subscriber[] = [];
  @Output() addSubscriber = new EventEmitter<void>();
  @Output() editSubscriber = new EventEmitter<Subscriber>();

  constructor(private elementRef: ElementRef) { }

  searchTerm = '';
  selectedPlan = '';
  selectedStatus = '';
  filteredSubscribers: Subscriber[] = [];
  paginatedSubscribers: Subscriber[] = [];
  currentPage = 1;
  pageSize = 14;

  showPlanDropdown = false;
  showStatusDropdown = false;

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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showPlanDropdown = false;
      this.showStatusDropdown = false;
    }
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
    this.applyFilters();
  }

  selectStatus(value: string, event: MouseEvent) {
    event.stopPropagation();
    this.selectedStatus = value;
    this.showStatusDropdown = false;
    this.applyFilters();
  }

  get selectedPlanLabel(): string {
    return this.planOptions.find(p => p.value === this.selectedPlan)?.label || 'All Plans';
  }

  get selectedStatusLabel(): string {
    return this.statusOptions.find(s => s.value === this.selectedStatus)?.label || 'All Status';
  }

  get totalPages(): number { return Math.ceil(this.filteredSubscribers.length / this.pageSize); }
  get totalPagesArray(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
  get pageStart(): number { return (this.currentPage - 1) * this.pageSize + 1; }
  get pageEnd(): number { return Math.min(this.currentPage * this.pageSize, this.filteredSubscribers.length); }

  ngOnChanges(): void { this.applyFilters(); }
  onSearch(): void { this.applyFilters(); }
  onFilter(): void { this.applyFilters(); }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active': return 'bg-[#F0FDF4] text-[#007A55]';
      case 'Paused': return 'bg-[#FEF3C7] text-[#BB4D00]';
      case 'Lapsed': return 'bg-[#FFF1F2] text-[#C70036]';
      default: return '';
    }
  }

  applyFilters(): void {
    this.filteredSubscribers = this.subscribers.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        s.hmsId.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchPlan = this.selectedPlan ? s.mealPlan === this.selectedPlan : true;
      const matchStatus = this.selectedStatus ? s.status === this.selectedStatus : true;
      return matchSearch && matchPlan && matchStatus;
    });
    this.currentPage = 1;
    this.paginate();
  }

  paginate(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedSubscribers = this.filteredSubscribers.slice(start, start + this.pageSize);
  }

  goToPage(p: number): void { this.currentPage = p; this.paginate(); }
  prevPage(): void { if (this.currentPage > 1) { this.currentPage--; this.paginate(); } }
  nextPage(): void { if (this.currentPage < this.totalPages) { this.currentPage++; this.paginate(); } }
  onAddSubscriber(): void { this.addSubscriber.emit(); }
  onEdit(sub: Subscriber): void { this.editSubscriber.emit(sub); }
}