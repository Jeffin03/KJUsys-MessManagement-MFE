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
  private roll_numberLookup = new Map<string, string>();
  private activeByMealPlan: { [key: string]: number } = {};
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
      // Initiate all network requests concurrently
      const subscribersPromise = firstValueFrom(this.subscriberService.getSubscribers());
      const schedulesPromise = firstValueFrom(this.dashboardService.getSchedules());
      const tapsPromise = firstValueFrom(this.dashboardService.getTaps());

      // 1. Wait for subscribers and process it first (required for other processing)
      const subscribers = await subscribersPromise;
      this.processSubscribers(subscribers);

      // 2. Wait for schedules and taps concurrently, then process them in parallel
      const [schedules, taps] = await Promise.all([
        schedulesPromise,
        tapsPromise
      ]);

      // Process schedules and taps concurrently (they don't depend on each other)
      this.processSchedules(schedules);
      this.processTaps(taps);

      // Mark loading as complete and initialize WebSocket
      this.isLoading = false;
      this.initWebSocket();
      this.cdr.detectChanges();

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      this.errorMessage = 'Failed to load dashboard data. Please try again later.';
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private processSubscribers(subscribers: Subscriber[]): void {
    const total = subscribers.length;
    let active = 0;
    const activeByMealPlan: { [key: string]: number } = {};

    // Build roll number lookup map while counting active users and active by meal plan
    this.roll_numberLookup.clear();
    for (const s of subscribers) {
      this.roll_numberLookup.set(s.name, s.roll_number);
      if (s.status === 'Active') {
        active++;
        // Count active subscribers for each meal plan character (skip 'None')
        if (s.mealPlan !== 'None') {
          const mealChars = s.mealPlan.split('+');
          for (const char of mealChars) {
            activeByMealPlan[char] = (activeByMealPlan[char] || 0) + 1;
          }
        }
      }
    }

    this.stats[0].value = total;
    this.stats[1].value = active;
    this.activeByMealPlan = activeByMealPlan;
  }

  private processSchedules(schedules: MealSlot[]): void {
    if (schedules && schedules.length > 0) {
      this.mealSlots = schedules.map((slot: MealSlot) => {
        const mealChar = slot.name.charAt(0).toUpperCase();
        const eligibleSubs = this.activeByMealPlan?.[mealChar] || 0;

        return {
          ...slot,
          total: eligibleSubs,
          hadMeal: 0,
          thirdStat: eligibleSubs, // Initial state before taps
          thirdLabel: slot.status === 'Closed' ? 'Skipped' : 'Pending'
        };
      });
    }
  }

  private processTaps(taps: MealEntry[]): void {
    const allowedTaps = taps.filter((t: MealEntry) => t.status === 'Allowed');
    const mealsServed = allowedTaps.length;
    const active = this.stats[1].value;

    this.stats[2].value = mealsServed;
    this.stats[3].value = Math.max(0, active - mealsServed);

    // Enrich taps with roll number and set recent entries
    if (taps.length > 0) {
      this.recentEntries = this.enrichTapsWithRollNumber(taps);
    }

    // Process meal slots with taps data
    if (this.mealSlots && this.mealSlots.length > 0) {
      // Create a map of mealSlot -> count for O(1) lookups
      const tapsByMealSlot: { [key: string]: number } = {};
      for (const tap of allowedTaps) {
        const mealSlotKey = tap.mealSlot.toLowerCase();
        tapsByMealSlot[mealSlotKey] = (tapsByMealSlot[mealSlotKey] || 0) + 1;
      }

      this.mealSlots = this.mealSlots.map((slot: MealSlot) => {
        const tapsForSlot = tapsByMealSlot[slot.name.toLowerCase()] || 0;

        return {
          ...slot,
          hadMeal: tapsForSlot,
          thirdStat: Math.max(0, (slot.total || 0) - tapsForSlot)
        };
      });
    }
  }

  private enrichTapsWithRollNumber(taps: MealEntry[]): MealEntry[] {
    return taps.map(t => ({
      ...t,
      roll_number: this.roll_numberLookup.get(t.customer) || t.roll_number
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
      roll_number: newTapData.roll_number || newTapData.rollNumber || newTapData.hmsId || newTapData.uid || '',
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
