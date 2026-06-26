import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, firstValueFrom, Observable, of, BehaviorSubject, filter, take, switchMap } from 'rxjs';
import { MealSlotsComponent } from './components/meal-slots/meal-slots.component';
import { EntriesTableComponent } from './components/entries-table/entries-table.component';
import { HardwareStatusComponent } from './components/hardware-status/hardware-status.component';
import { DashboardStat, MealSlot, MealEntry, HardwareDevice } from '../../shared/models/dashboard.models';
import { DashboardService } from './services/dashboard.service';
import { SubscriberService } from '../subscriber-management/services/subscriber.service';
import { Subscriber } from '../../shared/models/subscriber';
import { WebsocketService } from '../../shared/services/websocket.service';
import { NetworkService } from '../../shared/services/network.service';
import { ConnectionMonitorService } from '../../shared/services/connection-monitor.service';
import { BreadcrumbsTitleComponent } from '@libs/shared-ui';
import { TabItem, TabsModule } from '@libs/tabs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    TabsModule,
    MealSlotsComponent,
    EntriesTableComponent,
    HardwareStatusComponent,
    BreadcrumbsTitleComponent
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private uptimeInterval: any;
  private hardwarePollingInterval: any;
  private roll_numberLookup = new Map<string, string>();
  private activeByMealPlan: { [key: string]: number } = {};
  private subscriptions = new Subscription();

  breadcrumbs = [
    { label: 'Hostel' },
    { label: 'Mess Management' }
  ];

  tabs: TabItem[] = [
    { id: 'dashboard', label: 'Dashboard', subtitle: 'Overview' },
    { id: 'subscriber', label: 'Subscriber Management', subtitle: 'Manage Subscribers' },
    { id: 'reports', label: 'Reports', subtitle: 'View Reports' }
  ];
  activeTab = 'dashboard';

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



  stats: DashboardStat[] = [
    { label: 'Total Subscribers', value: 0, icon: 'subscribers', color: 'text-blue-400' },
    { label: 'Active Subscriptions', value: 0, icon: 'active', color: 'text-green-400' },
    { label: 'Total Meals Served Today', value: 0, icon: 'meals', color: 'text-indigo-400' },
    { label: 'Absent Today', value: 0, icon: 'absent', color: 'text-orange-400' },
  ];

  mealSlots: MealSlot[] = [];

  recentEntries: MealEntry[] = [];

  hardware: HardwareDevice[] = [
    {
      name: 'ESP32 Unit 1', icon: 'chip', status: 'Offline',
      deviceId: ''
    },
    {
      name: 'ESP32 Unit 2', icon: 'chip', status: 'Offline',
      deviceId: ''
    },
    {
      name: 'WiFi Router', icon: 'wifi', status: 'Offline',
      deviceId: ''
    },
    {
      name: 'POS Printer', icon: 'printer', status: 'Offline',
      deviceId: ''
    },
  ];

  uptimeSeconds = 0;
  isLoading = true;
  isHardwareRefreshing = false;
  errorMessage = '';

  constructor(
    private dashboardService: DashboardService,
    private subscriberService: SubscriberService,
    private websocketService: WebsocketService,
    private networkService: NetworkService,
    private connectionMonitor: ConnectionMonitorService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.uptimeInterval = setInterval(() => this.uptimeSeconds++, 1000);
    console.log('test up');

    // Subscribe to network status to update Wi-Fi router status in the hardware array using NetworkService
    this.subscriptions.add(
      this.networkService.isOnline$.subscribe(isOnline => {
        this.updateWifiStatus(isOnline);
      })
    );

    // Automatically refresh dashboard data when connection is restored AND WebSocket is open
    this.subscriptions.add(
      this.connectionMonitor.connectionRestored$.pipe(
        switchMap(() => this.websocketService.connectionState$.pipe(
          filter(state => state === 'open'),
          take(1)
        ))
      ).subscribe(() => {
        this.loadDataProgressively();
      })
    );

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
      const hardwarePromise = firstValueFrom(this.dashboardService.getHardwareStatus());

      // 1. Wait for subscribers and process it first (required for other processing)
      const subscribers = await subscribersPromise;
      this.processSubscribers(subscribers);

      // 2. Wait for schedules, taps, and hardware concurrently, then process them in parallel
      const [schedules, taps, hardwareResponse] = await Promise.all([
        schedulesPromise,
        tapsPromise,
        hardwarePromise
      ]);

      // Process schedules and taps concurrently (they don't depend on each other)
      this.processSchedules(schedules);
      this.processTaps(taps);
      // Process hardware
      this.hardware = hardwareResponse.hardware;
      this.uptimeSeconds = hardwareResponse.serverUptimeSeconds;

      // Update Wi-Fi router status based on browser online status
      this.updateWifiStatus();

      // Mark loading as complete and initialize WebSocket
      this.isLoading = false;
      console.log('[DEBUG] Calling initWebSocket()');
      this.initWebSocket();

      // Poll hardware status every 30s as fallback for live updates
      this.hardwarePollingInterval = setInterval(() => {
        this.dashboardService.getHardwareStatus(true).subscribe({
          next: (res) => {
            this.hardware = res.hardware;
            this.uptimeSeconds = res.serverUptimeSeconds;
            this.cdr.detectChanges();
          },
          error: () => { /* silent fail - WebSocket will handle */ }
        });
      }, 30000);

      this.cdr.detectChanges();

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      this.errorMessage = 'Failed to load dashboard data. Please try again later.';
      this.isLoading = false;
      if (this.hardware) {
        this.hardware.forEach(device => {
          if (device.icon !== 'wifi') {
            device.status = 'Offline';
          }
        });
      }
      this.updateWifiStatus();
      this.connectionMonitor.setServerDown(true);
      // Initialize WebSocket anyway to receive live tap events
      this.initWebSocket();
      this.cdr.detectChanges();
    }
  }

  /** Update Wi-Fi router status in hardware array based on browser's online status */
  private updateWifiStatus(isOnline: boolean = navigator.onLine): void {
    if (!this.hardware) {
      return;
    }
    const wifiDevice = this.hardware.find(device => device.icon === 'wifi');
    if (wifiDevice) {
      wifiDevice.status = isOnline ? 'Connected' : 'Offline';
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
      // Reverse to ensure the initial load shows newest taps at the top (reverse-chronological)
      this.recentEntries = this.enrichTapsWithRollNumber(taps).reverse();
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
    console.log('[DEBUG] initWebSocket called');
    this.websocketService.connect();

    // Listen for new taps and update only the taps data dynamically
    this.subscriptions.add(
      this.websocketService.tapNew$.subscribe(data => {
        console.log('[DEBUG] tapNew$ emitted:', data);
        this.ngZone.run(() => {
          this.updateTapData(data);
        });
      })
    );

    this.subscriptions.add(
      this.websocketService.tapDuplicate$.subscribe(data => {
        console.log('[DEBUG] tapDuplicate$ emitted:', data);
        this.ngZone.run(() => {
          this.updateTapData(data);
        });
      })
    );

    // Listen for hardware status updates
    this.subscriptions.add(
      this.websocketService.hardwareStatus$.subscribe(data => {
        console.log('[DEBUG] hardwareStatus$ emitted:', data);
        this.ngZone.run(() => {
          this.updateHardwareStatus(data);
        });
      })
    );
  }

  private updateTapData(newTapData: any): void {
    console.log('[DEBUG] WebSocket tap.new received:', newTapData);
    // Optimistic update: add the new tap to recent entries
    const newEntry = {
      customer: newTapData.name || 'Unknown',
      roll_number: newTapData.roll_number || '',
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

    // WebSocket tap.new is only broadcast on SUCCESS, so always increment stats
    const currentMealsServed = this.stats[2].value;
    this.stats[2].value = currentMealsServed + 1;
    this.stats[3].value = Math.max(0, this.stats[1].value - this.stats[2].value);

    // Update meal slot stats if needed
    this.updateMealSlotStats(newTapData);
    this.cdr.detectChanges();
  }

  private updateMealSlotStats(tapData: any): void {
    const tapMeal = (tapData.meal || '').toLowerCase();
    console.log('[DEBUG] updateMealSlotStats called with:', { tapMeal, mealSlots: this.mealSlots.map(s => ({ name: s.name, hadMeal: s.hadMeal, total: s.total })) });

    this.mealSlots = this.mealSlots.map(slot => {
      const slotMeal = (slot.name || '').toLowerCase();

      // Match by exact name, first letter, or dynamic first-letter codes (B, BR, L, S, D, LN, MS, etc.)
      // Also handle UPPERCASE from backend (BREAKFAST, LUNCH, etc.) vs capitalized slot names
      const slotCode = this.getMealCode(slotMeal);
      const tapCode = this.getMealCode(tapMeal);

      const isMatch =
        slotMeal === tapMeal ||
        slotCode === tapCode ||
        slotMeal.startsWith(tapMeal[0]) ||
        tapMeal.startsWith(slotMeal[0]) ||
        (slotMeal === 'brunch' && tapMeal === 'breakfast') ||
        (slotMeal === 'breakfast' && tapMeal === 'brunch');

      console.log('[DEBUG] Matching:', { slotMeal, tapMeal, slotCode, tapCode, isMatch });

      if (isMatch) {
        // WebSocket tap.new is only broadcast on SUCCESS, so always increment
        console.log('[DEBUG] Incrementing hadMeal for:', slot.name);
        return {
          ...slot,
          hadMeal: (slot.hadMeal || 0) + 1,
          thirdStat: Math.max(0, (slot.total || 0) - ((slot.hadMeal || 0) + 1)),
          thirdLabel: slot.status === 'Closed' ? 'Skipped' : 'Pending'
        };
      }
      return slot;
    });
  }

  private getMealCode(meal: string): string {
    const words = meal.trim().split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return meal;
    let code = '';
    for (const word of words) {
      code += word.charAt(0).toUpperCase();
    }
    return code;
  }

  private updateHardwareStatus(hardwareData: any): void {
    this.hardware = hardwareData.hardware.map((device: any) => ({
      deviceId: device.deviceId,
      name: device.name,
      icon: device.icon,
      status: device.status as HardwareDevice['status'],
      lastSeenMs: device.lastSeenMs
    }));
    this.uptimeSeconds = hardwareData.serverUptimeSeconds;
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    if (this.uptimeInterval) clearInterval(this.uptimeInterval);
    if (this.hardwarePollingInterval) clearInterval(this.hardwarePollingInterval);
    this.subscriptions.unsubscribe();
    this.websocketService.disconnect();
  }

  onHardwareRefreshRequested(): void {
    this.isHardwareRefreshing = true;
    this.dashboardService.getHardwareStatus(true).subscribe({
      next: (response) => {
        this.hardware = response.hardware;
        this.uptimeSeconds = response.serverUptimeSeconds;
        this.isHardwareRefreshing = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to refresh hardware status', err);
        this.isHardwareRefreshing = false;
        this.connectionMonitor.setServerDown(true);
        this.cdr.detectChanges();
      }
    });
  }

  refreshMealSlots(): void {
    // Full refresh: fetch schedules, subscribers, and taps to recompute derived values
    this.dashboardService.getSchedules(true).subscribe({
      next: (schedules) => {
        this.subscriberService.getSubscribers().subscribe({
          next: (subscribers) => {
            this.processSubscribers(subscribers);
            this.processSchedules(schedules);
            this.dashboardService.getTaps().subscribe({
              next: (taps) => {
                this.processTaps(taps);
                this.cdr.detectChanges();
              },
              error: (err) => {
                console.error('Failed to fetch taps for meal slots refresh', err);
                this.cdr.detectChanges();
              }
            });
          },
          error: (err) => {
            console.error('Failed to fetch subscribers for meal slots refresh', err);
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Failed to refresh meal slots', err);
      }
    });
  }
}
