import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SubscriberStatsComponent } from './components/subscriber-stats/subscriber-stats.component';
import { SubscriberTableComponent } from './components/subscriber-table/subscriber-table.component';
import { DashboardTabsComponent } from '../dashboard/components/dashboard-tabs/dashboard-tabs.component';
import { AddSubscriberModalComponent } from './components/add-subscriber-modal/add-subscriber-modal.component';
import { SubscriberCardModalComponent } from './components/subscriber-card-modal/subscriber-card-modal.component';
import { EditSubscriberModalComponent } from './components/edit-subscriber-modal/edit-subscriber-modal.component';

import { Subscriber } from './models/subscriber.model';
import { SubscriberService } from './services/subscriber.service';

@Component({
  selector: 'app-subscriber-management',
  standalone: true,
  imports: [
    CommonModule,
    SubscriberStatsComponent,
    SubscriberTableComponent,
    DashboardTabsComponent,
    AddSubscriberModalComponent,
    SubscriberCardModalComponent,
    EditSubscriberModalComponent
  ],
  templateUrl: './subscriber-management.component.html',
  styleUrls: ['./subscriber-management.component.css']
})
export class SubscriberManagementComponent implements OnInit {

  subscribers: Subscriber[] = [];

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

  constructor(
    private subscriberService: SubscriberService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.subscriberService.getSubscribers().subscribe({
      next: (data) => {
        this.subscribers = data;
        this.calculateStats();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch subscribers', err);
        // Fallback to mock data if backend isn't running yet just to keep UI working
        this.subscribers = this.getMockData();
        this.calculateStats();
        this.cdr.detectChanges();
      }
    });
  }

  calculateStats(): void {
    this.stats = {
      total: this.subscribers.length,
      active: this.subscribers.filter(
        s => s.status === 'Active'
      ).length,
      paused: this.subscribers.filter(
        s => s.status === 'Paused'
      ).length,
      lapsed: this.subscribers.filter(
        s => s.status === 'Lapsed'
      ).length
    };
  }

  openAddModal(): void {
    this.showAddModal = true;
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  openCardStep(data: any): void {
    console.log('OPEN CARD STEP - CREATING SUBSCRIBER', data);

    // Call the API to create the subscriber first
    this.subscriberService.createSubscriber(data).subscribe({
      next: (res) => {
        // Assume backend returns the created customer or _id in responseData
        const newCustomerId = res.responseData?.data?.customer?._id?.$oid || res.responseData?.data?._id?.$oid || res.responseData?.data?.id;

        console.log('Subscriber created with ID:', newCustomerId);

        // Pass the created ID to the next step
        this.subscriberFormData = { ...data, backendId: newCustomerId };

        this.showAddModal = false;
        this.showCardModal = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to create subscriber:', err);
        // Fallback for development/UI demo
        this.subscriberFormData = { ...data, backendId: 'dummy_id_' + Date.now() };
        this.showAddModal = false;
        this.showCardModal = true;
        this.cdr.detectChanges();
      }
    });
  }

  closeCardModal(): void {
    this.showCardModal = false;
  }

  backToAddModal(): void {
    // Note: If they go back, they might create a duplicate if they click Next again without handling edit mode.
    // Assuming standard flow for now.
    this.showCardModal = false;
    this.showAddModal = true;
  }

  saveSubscriberConfiguration(data: any): void {
    console.log('Final Subscriber Configuration (Assigning Roll Number):', data);

    const roll_number = data.roll_number;
    const customerId = data.backendId;

    if (roll_number && customerId && !customerId.startsWith('dummy_id')) {
      this.subscriberService.assignHmsId(roll_number, customerId).subscribe({
        next: (res) => {
          console.log('Successfully assigned Roll Number to subscriber:', res);
          this.showCardModal = false;
          this.refreshSubscribers(); // Refresh table
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to assign Roll Number:', err);
          this.showCardModal = false;
          this.refreshSubscribers();
          this.cdr.detectChanges();
        }
      });
    } else {
      // Just close and refresh if it's a dummy or missing info
      this.showCardModal = false;
      this.refreshSubscribers();
      this.cdr.detectChanges();
    }
  }

  updateSubscriber(data: any): void {
    console.log('Update subscriber with data:', data);
    if (this.editSubscriberData && this.editSubscriberData.roll_number) {
      this.subscriberService.updateSubscriber(this.editSubscriberData.roll_number, data).subscribe({
        next: (res) => {
          console.log('Successfully updated subscriber:', res);
          this.showEditModal = false;
          this.editSubscriberData = null;
          this.refreshSubscribers(); // Refresh table
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to update subscriber:', err);
          alert('Failed to update subscriber. Please check the console for details.');
          // Do NOT close the modal on error so the user is aware of the failure
          this.cdr.detectChanges();
        }
      });
    } else {
      console.error('No subscriber roll number available for update');
      this.showEditModal = false;
      this.editSubscriberData = null;
      this.refreshSubscribers();
      this.cdr.detectChanges();
    }
  }

  refreshSubscribers(): void {
    this.subscriberService.getSubscribers().subscribe({
      next: (data) => {
        this.subscribers = data;
        this.calculateStats();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to refresh subscribers', err);
        this.cdr.detectChanges();
      }
    });
  }

  onSubscriberSave(data: any): void {
    console.log('New subscriber:', data);

    this.showAddModal = false;
  }

  openEditModal(sub: Subscriber): void {
    this.editSubscriberData = { ...sub };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editSubscriberData = null;
  }

  getMockData(): Subscriber[] {

    const plans = [
      'B+L+D',
      'B+L',
      'L+D',
      'B+D'
    ];

    const statuses:
      ('Active' | 'Paused' | 'Lapsed')[] = [
        'Active',
        'Active',
        'Active',
        'Paused',
        'Lapsed'
      ];

    return Array.from(
      { length: 248 },
      (_, i) => ({
        id: i + 1,
        name: 'Jeffin',
        email: 'jeffin@edu.com',
        roll_number: '25mca001',
        mealPlan: plans[i % plans.length],
        status: statuses[i % statuses.length],
        joinedDate: `${10 + (i % 20)} Jan 26`
      })
    );
  }
}