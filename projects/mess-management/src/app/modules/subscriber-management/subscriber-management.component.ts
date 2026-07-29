import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

import { StudentDetailComponent } from './components/student-detail/student-detail.component';

import { SubscriberStatsComponent } from './components/subscriber-stats/subscriber-stats.component';
import { SubscriberTableComponent } from './components/subscriber-table/subscriber-table.component';
import { AddSubscriberModalComponent } from './components/add-subscriber-modal/add-subscriber-modal.component';
import { EditSubscriberModalComponent } from './components/edit-subscriber-modal/edit-subscriber-modal.component';
import { BulkUploadModalComponent } from './components/bulk-upload-modal/bulk-upload-modal.component';

import { Subscriber } from '../../shared/models/subscriber';
import { SubscriberService } from './services/subscriber.service';
import { QuickModalComponent } from '../../shared/components/quick-modal/quick-modal.component';
import { NetworkService } from '../../shared/services/network.service';
import { ConnectionMonitorService } from '../../shared/services/connection-monitor.service';
import { SharedToastService } from '@libs/shared-toast';
import { BreadcrumbsTitleComponent, ButtonComponent } from '@libs/shared-ui';
import { TabItem, TabsModule } from '@libs/tabs';
import { MealSlotService, MealSlotWithCode } from '../../shared/services/meal-slot.service';

@Component({
  selector: 'app-subscriber-management',
  standalone: true,
  imports: [
    CommonModule,
    TabsModule,
    SubscriberStatsComponent,
    SubscriberTableComponent,
    AddSubscriberModalComponent,
    EditSubscriberModalComponent,
    BreadcrumbsTitleComponent,
    ButtonComponent,
    QuickModalComponent,
    StudentDetailComponent,
    BulkUploadModalComponent
  ],
  templateUrl: './subscriber-management.component.html',
  styleUrls: ['./subscriber-management.component.css']
})
export class SubscriberManagementComponent implements OnInit, OnDestroy {

  tabs: TabItem[] = [
    { id: 'dashboard', label: 'Dashboard', subtitle: 'Dashboard Overview' },
    { id: 'subscriber', label: 'Subscriber Management', subtitle: 'Manage Subscribers' },
    { id: 'reports', label: 'Reports', subtitle: 'View Reports' }
  ];
  activeTab = 'subscriber';

  onTabChange(tabId: string) {
    this.activeTab = tabId;
    if (tabId === 'dashboard') {
      this.router.navigate(['../dashboard'], { relativeTo: this.route });
    } else if (tabId === 'subscriber') {
      this.router.navigate(['../subscriber-management'], { relativeTo: this.route });
    } else if (tabId === 'reports') {
      this.router.navigate(['../reports'], { relativeTo: this.route });
    }
  }

  get breadcrumbs() {
    const crumbs = [
      { label: 'Hostel' },
      { label: 'Mess Management' }
    ];
    if (this.selectedStudentAdmissionNumber) {
      crumbs.push({ label: this.selectedStudentAdmissionNumber });
    }
    return crumbs;
  }

  subscribers: Subscriber[] = [];
  isLoading = false;
  totalItems = 0;
  currentPage = 1;
  pageSize = 10;

  searchQuery = '';
  selectedMealSlots: any[] = [];
  selectedStatuses: any[] = [];
  expiryFilterDays: number | null = null;
  clientPaginationMode = false;

  allSubscribers: Subscriber[] = [];
  stats = {
    total: 0,
    active: 0,
    paused: 0,
    lapsed: 0
  };

  mealSlotList: any[] = [];

  showAddModal = false;
  showBulkUploadModal = false;
  showCardModal = false;
  showEditModal = false;
  showQuickModal = false;
  quickModalAdmissionNumber: string | null = null;
  selectedStudentAdmissionNumber: string | null = null;
  detailRefreshKey = 0;

  subscriberFormData: any = null;
  editSubscriberData: any = null;

  showDeleteConfirmPopup = false;
  pendingDeleteSubscriber: Subscriber | null = null;

  private searchSubject = new Subject<string>();
  private searchSubscription: Subscription | null = null;

  constructor(
    private subscriberService: SubscriberService,
    private networkService: NetworkService,
    private connectionMonitor: ConnectionMonitorService,
    private cdr: ChangeDetectorRef,
    private toastService: SharedToastService,
    private router: Router,
    private route: ActivatedRoute,
    private mealSlotService: MealSlotService,
  ) { }

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(search => {
      this.searchQuery = search;
      this.currentPage = 1;
      this.fetchSubscribers();
    });

    this.route.queryParams.subscribe(params => {
      const roll = params['student'];
      if (roll) {
        this.selectedStudentAdmissionNumber = roll;
      }
    });

    this.fetchMealSlots();
    this.fetchInitialData();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  private fetchMealSlots(): void {
    this.mealSlotService.getMealSlots(true).subscribe((slots: MealSlotWithCode[]) => {
      this.mealSlotList = slots.map(s => ({ name: s.name }));
    });
  }

  fetchInitialData(): void {
    this.isLoading = true;
    this.searchQuery = '';
    this.selectedMealSlots = [];
    this.selectedStatuses = [];
    this.expiryFilterDays = null;
    this.clientPaginationMode = false;
    this.currentPage = 1;

    // Fetch first page for immediate table display — small payload, fast
    this.subscriberService.getSubscribers('', 0, this.pageSize, '', '').subscribe({
      next: ({ subscribers, total }) => {
        this.subscribers = subscribers;
        this.totalItems = total;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch initial subscribers', err);
        this.connectionMonitor.setServerDown(true);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });

    // Fetch all subscribers for stats in background (does not block table)
    this.subscriberService.getSubscribers('', 0, 10000, '', '').subscribe({
      next: ({ subscribers }) => {
        this.allSubscribers = subscribers;
        this.calculateStats();
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      }
    });
  }

  private filterByMealSlots(data: Subscriber[]): Subscriber[] {
    const selected = this.selectedMealSlots.map(s => String(s.name || '').toLowerCase()).filter(Boolean);
    if (selected.length === 0) return data;
    return data.filter(sub => {
      const subMeals = (sub.mealNames || []).map(m => m.toLowerCase());
      return selected.every(s => subMeals.includes(s));
    });
  }

  private filterByStatus(data: Subscriber[]): Subscriber[] {
    const selected = this.selectedStatuses.map(s => String(s.name || '').toLowerCase()).filter(Boolean);
    if (selected.length === 0) return data;
    return data.filter(sub => selected.includes(sub.status.toLowerCase()));
  }

  private filterByExpiry(data: Subscriber[]): Subscriber[] {
    if (this.expiryFilterDays === null) return data;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartTs = todayStart.getTime();
    const maxTs = todayStartTs + this.expiryFilterDays * 24 * 60 * 60 * 1000;
    return data.filter(sub => {
      if (sub.status !== 'Active') return false;
      // Parse endDate (DD/MM/YY) to timestamp
      if (!sub.endDate) return false;
      const [d, m, y] = sub.endDate.split('/');
      const endTs = new Date(2000 + parseInt(y), parseInt(m) - 1, parseInt(d)).getTime();
      return endTs >= todayStartTs && endTs <= maxTs;
    });
  }

  private fetchSubscribers(): void {
    this.isLoading = true;

    const statusStr = this.selectedStatuses.map(s => s.name || '').filter(Boolean).join(',');

    if (this.clientPaginationMode) {
      this.subscriberService.getSubscribers(this.searchQuery, 0, 10000, '', statusStr).subscribe({
        next: ({ subscribers }) => {
          let filtered = this.filterByMealSlots(subscribers);
          filtered = this.filterByStatus(filtered);
          filtered = this.filterByExpiry(filtered);
          this.subscribers = filtered;
          this.totalItems = filtered.length;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to fetch subscribers', err);
          this.connectionMonitor.setServerDown(true);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      const apiPage = this.currentPage - 1;
      this.subscriberService.getSubscribers(this.searchQuery, apiPage, this.pageSize, '', statusStr).subscribe({
        next: ({ subscribers, total }) => {
          this.subscribers = subscribers;
          this.totalItems = total;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to fetch subscribers', err);
          this.connectionMonitor.setServerDown(true);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  calculateStats(): void {
    this.stats = {
      total: this.allSubscribers.length,
      active: this.allSubscribers.filter(s => s.status === 'Active').length,
      paused: this.allSubscribers.filter(s => s.status === 'Paused').length,
      lapsed: this.allSubscribers.filter(s => s.status === 'Lapsed').length
    };
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  onMealSlotChange(slots: any[]): void {
    this.selectedMealSlots = slots;
    this.clientPaginationMode = slots.length > 0 || this.selectedStatuses.length > 0 || this.expiryFilterDays !== null;
    this.currentPage = 1;
    this.fetchSubscribers();
  }

  onStatusChange(statuses: any[]): void {
    this.selectedStatuses = statuses;
    this.clientPaginationMode = statuses.length > 0 || this.selectedMealSlots.length > 0 || this.expiryFilterDays !== null;
    this.currentPage = 1;
    this.fetchSubscribers();
  }

  onExpiryChange(days: number | null): void {
    this.expiryFilterDays = days;
    this.clientPaginationMode = days !== null || this.selectedMealSlots.length > 0 || this.selectedStatuses.length > 0;
    this.currentPage = 1;
    this.fetchSubscribers();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    if (this.clientPaginationMode) return;
    this.fetchSubscribers();
  }

  onSizeChange(size: number): void {
    this.pageSize = size;
    if (this.clientPaginationMode) return;
    this.currentPage = 1;
    this.fetchSubscribers();
  }

  /**
   * Exports filtered subscribers to CSV.
   * Columns: Name, Admission Number, Class & Section, Hostel Name, Hostel Warden,
   * Meal Plan, Status, Joined Date.
   * Uses BOM prefix for proper UTF-8 encoding in Excel.
   */
  onExportRequest(): void {
    const planStr = this.selectedMealSlots.map(s => s.name || '').filter(Boolean).join(',');
    const statusStr = this.selectedStatuses.map(s => s.name || '').filter(Boolean).join(',');

    this.subscriberService.getSubscribers(this.searchQuery, 0, 100000, planStr, statusStr).subscribe({
      next: ({ subscribers }) => {
        const exportData = subscribers;
        const headers = ['Name', 'Admission Number', 'Class & Section', 'Hostel Name', 'Hostel Warden', 'Meal Plan', 'Status', 'Joined Date'];
        const rows = exportData.map(sub => [
          this.escapeCsv(sub.name),
          this.escapeCsv(sub.admission_number),
          this.escapeCsv(sub.classSection),
          this.escapeCsv(sub.hostel_name),
          this.escapeCsv(sub.hostel_warden),
          this.escapeCsv(sub.mealPlan),
          this.escapeCsv(sub.status),
          this.escapeCsv(sub.joinedDate),
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'subscribers.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Failed to fetch data for export', err);
        this.toastService.error('Failed to export subscribers.');
      }
    });
  }

  private escapeCsv(val: string): string {
    if (!val) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  openAddModal(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  openBulkUploadModal(): void {
    this.showBulkUploadModal = true;
  }

  closeBulkUploadModal(): void {
    this.showBulkUploadModal = false;
  }

  onBulkUploadComplete(): void {
    this.showBulkUploadModal = false;
    this.fetchInitialData();
  }

  onSubscriberSave(data: any): void {
    console.log('Creating new subscriber:', data);

    this.subscriberService.createSubscriber(data).subscribe({
      next: (res) => {
        const admissionNumber = res.responseData?.data?.admission_number || res.responseData?.data?.admissionNumber;
        console.log('Subscriber created with admission number:', admissionNumber);
        this.subscriberFormData = { ...data, admission_number: admissionNumber };
        this.toastService.success('Subscriber created successfully.');
        this.showAddModal = false;
        this.fetchInitialData();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to create subscriber:', err);
        this.showAddModal = false;
        this.connectionMonitor.setServerDown(true);
        this.toastService.error('Failed to create subscriber.');
        this.fetchInitialData();
        this.cdr.detectChanges();
      }
    });
  }

  closeCardModal(): void {
    this.showCardModal = false;
  }

  backToAddModal(): void {
    this.showCardModal = false;
    this.showAddModal = true;
  }

  saveSubscriberConfiguration(data: any): void {
    console.log('Final Subscriber Configuration:', data);

    this.showCardModal = false;
    this.fetchInitialData();
    this.cdr.detectChanges();
  }

  updateSubscriber(data: any): void {
    console.log('Update subscriber with data:', data);
    if (this.editSubscriberData && this.editSubscriberData.admission_number) {
      this.subscriberService.updateSubscriber(this.editSubscriberData.admission_number, data).subscribe({
        next: (res) => {
          console.log('Successfully updated subscriber:', res);
          const innerStatus = res.responseData?.data?.status;
          if (innerStatus === 'ERROR') {
            const message = res.responseData?.data?.message || 'Update failed. Please refresh and try again.';
            this.toastService.error(message);
          } else {
            this.toastService.success('Subscriber updated successfully.');
          }
          this.showEditModal = false;
          this.editSubscriberData = null;
          this.detailRefreshKey++;
          this.fetchInitialData();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to update subscriber:', err);
          const message = err.error?.responseData?.data?.message || 'Failed to update subscriber.';
          this.toastService.error(message);
          this.showEditModal = false;
          this.editSubscriberData = null;
          this.fetchInitialData();
          this.cdr.detectChanges();
        }
      });
    } else {
      console.error('No subscriber admission number available for update');
      this.showEditModal = false;
      this.editSubscriberData = null;
      this.fetchInitialData();
      this.cdr.detectChanges();
    }
  }

  openQuickModal(sub: Subscriber): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { student: sub.admission_number },
      queryParamsHandling: 'merge'
    });
  }

  openEditModal(sub: Subscriber): void {
    this.editSubscriberData = { ...sub };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editSubscriberData = null;
  }

  requestDeleteSubscriber(subscriber: Subscriber): void {
    this.pendingDeleteSubscriber = subscriber;
    this.showDeleteConfirmPopup = true;
  }

  backFromStudentDetail(): void {
    this.selectedStudentAdmissionNumber = null;
    this.router.navigate([], { relativeTo: this.route, queryParams: { student: null }, queryParamsHandling: 'merge' });
  }

  viewStudentFromLookup(admissionNumber: string): void {
    this.showAddModal = false;
    this.selectedStudentAdmissionNumber = admissionNumber;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { student: admissionNumber },
      queryParamsHandling: 'merge'
    });
  }

  cancelDeleteSubscriber(): void {
    this.showDeleteConfirmPopup = false;
    this.pendingDeleteSubscriber = null;
  }

  confirmDeleteSubscriber(): void {
    if (this.pendingDeleteSubscriber && this.pendingDeleteSubscriber.admission_number) {
      this.subscriberService.deleteSubscriber(this.pendingDeleteSubscriber.admission_number).subscribe({
        next: (res) => {
          this.toastService.success('Subscriber deleted successfully.');
          this.showDeleteConfirmPopup = false;
          this.pendingDeleteSubscriber = null;
          this.fetchInitialData();
        },
        error: (err) => {
          console.error('Failed to delete subscriber:', err);
          this.toastService.error('Failed to delete subscriber.');
          this.showDeleteConfirmPopup = false;
          this.pendingDeleteSubscriber = null;
          this.cdr.detectChanges();
        }
      });
    }
  }

}
