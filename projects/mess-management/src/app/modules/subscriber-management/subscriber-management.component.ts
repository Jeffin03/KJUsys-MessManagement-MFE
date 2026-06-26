import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

import { SubscriberStatsComponent } from './components/subscriber-stats/subscriber-stats.component';
import { SubscriberTableComponent } from './components/subscriber-table/subscriber-table.component';
import { AddSubscriberModalComponent } from './components/add-subscriber-modal/add-subscriber-modal.component';
import { EditSubscriberModalComponent } from './components/edit-subscriber-modal/edit-subscriber-modal.component';

import { Subscriber } from '../../shared/models/subscriber';
import { SubscriberService } from './services/subscriber.service';
import { NetworkService } from '../../shared/services/network.service';
import { ConnectionMonitorService } from '../../shared/services/connection-monitor.service';
import { SharedToastService } from '@libs/shared-toast';
import { BreadcrumbsTitleComponent, ButtonComponent } from '@libs/shared-ui';
import { TabItem, TabsModule } from '@libs/tabs';

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
    ButtonComponent
  ],
  templateUrl: './subscriber-management.component.html',
  styleUrls: ['./subscriber-management.component.css']
})
export class SubscriberManagementComponent implements OnInit {

  tabs: TabItem[] = [
    { id: 'dashboard', label: 'Dashboard', subtitle: 'Overview' },
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
      // this.router.navigate(['../reports'], { relativeTo: this.route });
    }
  }

  breadcrumbs = [
    { label: 'Hostel' },
    { label: 'Mess Management' }
  ];

  subscribers: Subscriber[] = [];
  totalCount = 0;
  currentPage = 1;
  pageSize = 14;
  isLoading = false;

  searchTerm = '';
  selectedPlan = '';
  selectedStatus = '';

  stats = {
    total: 0,
    active: 0,
    paused: 0,
    lapsed: 0
  };

  showAddModal = false;
  showCardModal = false;

  showEditModal = false;

  subscriberFormData: any = null;

  editSubscriberData: any = null;

  showDeleteConfirmPopup = false;
  pendingDeleteSubscriber: Subscriber | null = null;

  constructor(
    private subscriberService: SubscriberService,
    private networkService: NetworkService,
    private connectionMonitor: ConnectionMonitorService,
    private cdr: ChangeDetectorRef,
    private toastService: SharedToastService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.loadSubscribers();
  }

  loadSubscribers(): void {
    this.isLoading = true;
    this.subscriberService.getSubscribers(this.searchTerm, this.currentPage - 1, this.pageSize, this.selectedPlan, this.selectedStatus).subscribe({
      next: (data) => {
        this.subscribers = data;
        this.isLoading = false;
        this.calculateStats();
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

  calculateStats(): void {
    // Stats are based on full dataset - we'd need a separate endpoint for accurate stats
    // For now, use current page data as approximation
    this.stats = {
      total: this.totalCount || this.subscribers.length,
      active: this.subscribers.filter(s => s.status === 'Active').length,
      paused: this.subscribers.filter(s => s.status === 'Paused').length,
      lapsed: this.subscribers.filter(s => s.status === 'Lapsed').length
    };
  }

  openAddModal(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onSubscriberSave(data: any): void {
    console.log('Creating new subscriber:', data);
    
    this.subscriberService.createSubscriber(data).subscribe({
      next: (res) => {
        const newCustomerId = res.responseData?.data?.customer?._id?.$oid || res.responseData?.data?._id?.$oid || res.responseData?.data?.id;
        console.log('Subscriber created with ID:', newCustomerId);
        this.subscriberFormData = { ...data, backendId: newCustomerId };
        this.toastService.success('Subscriber created successfully.');
        this.showAddModal = false;
        this.loadSubscribers();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to create subscriber:', err);
        this.showAddModal = false;
        this.connectionMonitor.setServerDown(true);
        this.toastService.error('Failed to create subscriber.');
        this.loadSubscribers();
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
    this.loadSubscribers();
    this.cdr.detectChanges();
  }

  updateSubscriber(data: any): void {
    console.log('Update subscriber with data:', data);
    if (this.editSubscriberData && this.editSubscriberData.roll_number) {
      this.subscriberService.updateSubscriber(this.editSubscriberData.roll_number, data).subscribe({
        next: (res) => {
          console.log('Successfully updated subscriber:', res);
          this.showEditModal = false;
          this.editSubscriberData = null;
          this.loadSubscribers();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to update subscriber:', err);
          this.showEditModal = false;
          this.editSubscriberData = null;
          this.connectionMonitor.setServerDown(true);
          this.loadSubscribers();
          this.cdr.detectChanges();
        }
      });
    } else {
      console.error('No subscriber roll number available for update');
      this.showEditModal = false;
      this.editSubscriberData = null;
      this.loadSubscribers();
      this.cdr.detectChanges();
    }
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.loadSubscribers();
  }

  onFilterChange(filters: { plan: string; status: string }): void {
    this.selectedPlan = filters.plan;
    this.selectedStatus = filters.status;
    this.currentPage = 1;
    this.loadSubscribers();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadSubscribers();
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

  cancelDeleteSubscriber(): void {
    this.showDeleteConfirmPopup = false;
    this.pendingDeleteSubscriber = null;
  }

  confirmDeleteSubscriber(): void {
    if (this.pendingDeleteSubscriber && this.pendingDeleteSubscriber.roll_number) {
      this.subscriberService.deleteSubscriber(this.pendingDeleteSubscriber.roll_number).subscribe({
        next: (res) => {
          this.toastService.success('Subscriber deleted successfully.');
          this.showDeleteConfirmPopup = false;
          this.pendingDeleteSubscriber = null;
          this.loadSubscribers();
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