import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, firstValueFrom } from 'rxjs';
import { MealSlotsComponent } from './components/meal-slots/meal-slots.component';
import { EntriesTableComponent } from './components/entries-table/entries-table.component';
import { HardwareStatusComponent } from './components/hardware-status/hardware-status.component';
import { DashboardStat, MealSlot, MealEntry, HardwareDevice } from '../../shared/models/dashboard.models';
import { DashboardService } from './services/dashboard.service';
import { SubscriberService } from '../subscriber-management/services/subscriber.service';
import { Subscriber } from '../../shared/models/subscriber';
import { DashboardTabsComponent } from './components/dashboard-tabs/dashboard-tabs.component';
import { WebsocketService } from '../../shared/services/websocket.service';

import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MealSlotsComponent,
    EntriesTableComponent,
    HardwareStatusComponent,
    DashboardTabsComponent,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private uptimeInterval: any;
  private hmsIdLookup = new Map<string, string>();
  private subscriptions = new Subscription();

  stats: DashboardStat[] = [
    { label: 'Total Subscribers', value: 0, icon: 'subscribers', color: 'text-blue-400' },
    { label: 'Active Subscriptions', value: 0, icon: 'active', color: 'text-green-400' },
    { label: 'Total Meals Served Today', value: 0, icon: 'meals', color: 'text-indigo-400' },
    { label: 'Absent Today', value: 0, icon: 'absent', color: 'text-orange-400' },
  ];

  mealSlots: MealSlot[] = [];

  recentEntries: MealEntry[] = [];

  hardware: HardwareDevice[] = [
    { name: 'ESP32 Unit 1', icon: 'chip', status: 'Online' },
    { name: 'ESP32 Unit 2', icon: 'chip', status: 'Online' },
    { name: 'WiFi Router', icon: 'wifi', status: 'Connected' },
    { name: 'POS Printer', icon: 'printer', status: 'Low Paper' },
  ];

  uptimeSeconds = 6 * 3600 + 42 * 60;
  isLoading = true;
  errorMessage = '';

  constructor(
    private dashboardService: DashboardService,
    private subscriberService: SubscriberService,
    private websocketService: WebsocketService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) { }

  ngOnInit() {
    this.uptimeInterval = setInterval(() => this.uptimeSeconds++, 1000);
    console.log('test up');

    this.loadDataProgressively();

    console.log('test down');
  }

  private async loadDataProgressively() {
    this.isLoading = true;
    try {
      // 1. Load subscribers first
      const subscribers = await firstValueFrom(this.subscriberService.getSubscribers());
      this.processSubscribers(subscribers);

      // 2. Load schedules next
      const schedules = await firstValueFrom(this.dashboardService.getSchedules());
      this.processSchedules(schedules, subscribers);

      // 3. Load taps last
      const taps = await firstValueFrom(this.dashboardService.getTaps());

      // We can use setTimeout to avoid blocking the main thread during heavy tap processing
      setTimeout(() => {
        this.processTaps(taps);
        this.isLoading = false;
        this.initWebSocket();
      }, 0);

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      this.errorMessage = 'Failed to load dashboard data. Please try again later.';
      this.isLoading = false;
    }
    this.cdr.detectChanges();
  }

  private processSubscribers(subscribers: Subscriber[]): void {
    const total = subscribers.length;
    let active = 0;

    // Build HMS ID lookup map while counting active users to reduce loops
    this.hmsIdLookup.clear();
    for (const s of subscribers) {
      this.hmsIdLookup.set(s.name, s.hmsId);
      if (s.status === 'Active') {
        active++;
      }
    }

    this.stats[0].value = total;
    this.stats[1].value = active;
    this.cdr.detectChanges();
  }

  private processSchedules(schedules: MealSlot[], subscribers: Subscriber[]): void {
    if (schedules && schedules.length > 0) {
      this.mealSlots = schedules.map((slot: MealSlot) => {
        const mealChar = slot.name.charAt(0).toUpperCase();
        let eligibleSubs = 0;

        for (const s of subscribers) {
          if (s.status === 'Active' && s.mealPlan.includes(mealChar)) {
            eligibleSubs++;
          }
        }

        return {
          ...slot,
          total: eligibleSubs,
          hadMeal: 0,
          thirdStat: eligibleSubs, // Initial state before taps
          thirdLabel: slot.status === 'Closed' ? 'Skipped' : 'Pending'
        };
      });
    }
    this.cdr.detectChanges();
  }

  private processTaps(taps: MealEntry[]): void {
    const allowedTaps = taps.filter((t: MealEntry) => t.status === 'Allowed');
    const mealsServed = allowedTaps.length;
    const active = this.stats[1].value;

    this.stats[2].value = mealsServed;
    this.stats[3].value = Math.max(0, active - mealsServed);

    // Enrich taps with HMS ID and set recent entries
    if (taps.length > 0) {
      this.recentEntries = this.enrichTapsWithHmsId(taps);
    }

    // Process meal slots with taps data
    if (this.mealSlots && this.mealSlots.length > 0) {
      this.mealSlots = this.mealSlots.map((slot: MealSlot) => {
        const tapsForSlot = allowedTaps.filter((t: MealEntry) => t.mealSlot.toLowerCase() === slot.name.toLowerCase()).length;

        return {
          ...slot,
          hadMeal: tapsForSlot,
          thirdStat: Math.max(0, (slot.total || 0) - tapsForSlot)
        };
      });
    }
  }

  private enrichTapsWithHmsId(taps: MealEntry[]): MealEntry[] {
    return taps.map(t => ({
      ...t,
      hmsId: this.hmsIdLookup.get(t.customer) || t.hmsId
    }));
  }

  initWebSocket() {
    this.websocketService.connect();

    // Listen for new taps and update only the taps data dynamically
    this.subscriptions.add(
      this.websocketService.tapNew$.subscribe(data => {
        this.ngZone.run(() => {
          this.updateTapData(data);
        });
      })
    );

    this.subscriptions.add(
      this.websocketService.tapDuplicate$.subscribe(data => {
        this.ngZone.run(() => {
          this.updateTapData(data);
        });
      })
    );
  }

  private updateTapData(newTapData: any): void {
    // Optimistic update: add the new tap to recent entries
    const newEntry = {
      customer: newTapData.name || 'Unknown',
      hmsId: newTapData.uid || '',
      mealSlot: newTapData.meal.charAt(0) + newTapData.meal.slice(1).toLowerCase() as any,
      time: new Date(newTapData.tap_DateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Allowed' as 'Allowed' | 'Not Subscribed'
    };

    // Add to beginning of recent entries (most recent first)
    this.recentEntries = [newEntry, ...this.recentEntries];

    // Keep only last 50 entries to prevent array from growing too large
    if (this.recentEntries.length > 50) {
      this.recentEntries = this.recentEntries.slice(0, 50);
    }

    // Update statistics
    if (newTapData.status === 'Allowed' || newTapData.status === 'allowed') {
      const currentMealsServed = this.stats[2].value;
      this.stats[2].value = currentMealsServed + 1;
      this.stats[3].value = Math.max(0, this.stats[1].value - this.stats[2].value);
    }

    // Update meal slot stats if needed
    this.updateMealSlotStats(newTapData);
    this.cdr.detectChanges();
  }

  private updateMealSlotStats(tapData: any): void {
    const mealSlotChar = tapData.meal.charAt(0) + tapData.meal.slice(1).toLowerCase();

    this.mealSlots = this.mealSlots.map(slot => {
      if (slot.name.toLowerCase() === mealSlotChar.toLowerCase()) {
        // Increment hadMeal count if this is an allowed tap
        if (tapData.status === 'Allowed' || tapData.status === 'allowed') {
          return {
            ...slot,
            hadMeal: (slot.hadMeal || 0) + 1,
            thirdStat: Math.max(0, (slot.total || 0) - ((slot.hadMeal || 0) + 1)),
            thirdLabel: slot.status === 'Closed' ? 'Skipped' : 'Pending'
          };
        }
      }
      return slot;
    });
  }

  ngOnDestroy() {
    if (this.uptimeInterval) clearInterval(this.uptimeInterval);
    this.subscriptions.unsubscribe();
    this.websocketService.disconnect();
  }
}
