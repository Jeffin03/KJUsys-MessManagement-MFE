import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { MealSlotsComponent } from './components/meal-slots/meal-slots.component';
import { EntriesTableComponent } from './components/entries-table/entries-table.component';
import { HardwareStatusComponent } from './components/hardware-status/hardware-status.component';
import { DashboardStat, MealSlot, MealEntry, HardwareDevice } from '../../shared/models/dashboard.models';
import { DashboardService } from './services/dashboard.service';
import { SubscriberService } from '../subscriber-management/services/subscriber.service';
import { Subscriber } from '../../shared/models/subscriber';
import { DashboardTabsComponent } from './components/dashboard-tabs/dashboard-tabs.component';

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

  constructor(
    private dashboardService: DashboardService,
    private subscriberService: SubscriberService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.uptimeInterval = setInterval(() => this.uptimeSeconds++, 1000);

    forkJoin({
      subs: this.subscriberService.getSubscribers(),
      schedules: this.dashboardService.getSchedules(),
      taps: this.dashboardService.getTaps()
    }).subscribe({
      next: ({ subs, schedules, taps }: { subs: Subscriber[], schedules: MealSlot[], taps: MealEntry[] }) => {
        const total = subs.length;
        const active = subs.filter((s: Subscriber) => s.status === 'Active').length;
        const allowedTaps = taps.filter((t: MealEntry) => t.status === 'Allowed');
        const mealsServed = allowedTaps.length;

        this.stats[0].value = total;
        this.stats[1].value = active;
        this.stats[2].value = mealsServed;
        this.stats[3].value = Math.max(0, active - mealsServed);

        this.hmsIdLookup.clear();
        subs.forEach((s: Subscriber) => this.hmsIdLookup.set(s.name, s.hmsId));

        if (taps.length > 0) {
          this.recentEntries = this.enrichTapsWithHmsId(taps);
        }

        if (schedules && schedules.length > 0) {
          this.mealSlots = schedules.map((slot: MealSlot) => {
            const mealChar = slot.name.charAt(0).toUpperCase();
            const eligibleSubs = subs.filter((s: Subscriber) => s.status === 'Active' && s.mealPlan.includes(mealChar)).length;

            const tapsForSlot = allowedTaps.filter((t: MealEntry) => t.mealSlot.toLowerCase() === slot.name.toLowerCase()).length;

            return {
              ...slot,
              total: eligibleSubs,
              hadMeal: tapsForSlot,
              thirdStat: Math.max(0, eligibleSubs - tapsForSlot),
              thirdLabel: slot.status === 'Closed' ? 'Skipped' : 'Pending'
            };
          });
        }

        this.startLiveTapPolling();

      },
      error: (err: any) => console.error('Failed to load dashboard data:', err)
    });
  }

  private tapPollingInterval: any;

  private enrichTapsWithHmsId(taps: MealEntry[]): MealEntry[] {
    return taps.map(t => ({
      ...t,
      hmsId: this.hmsIdLookup.get(t.customer) || t.hmsId
    }));
  }

  startLiveTapPolling() {
    this.tapPollingInterval = setInterval(() => {
      this.dashboardService.getTaps().subscribe({
        next: (taps: MealEntry[]) => {
          if (taps.length > 0) {
            this.recentEntries = this.enrichTapsWithHmsId(taps);

            const allowedTaps = taps.filter(t => t.status === 'Allowed');
            const mealsServed = allowedTaps.length;
            this.stats[2].value = mealsServed;
            this.stats[3].value = Math.max(0, this.stats[1].value - mealsServed);
          }
        }
      });
    }, 3000);
  }

  ngOnDestroy() {
    if (this.uptimeInterval) clearInterval(this.uptimeInterval);
    if (this.tapPollingInterval) clearInterval(this.tapPollingInterval);
  }


  breadcrumbs = [
    { label: 'Hostel' },
    { label: 'Mess Management' }
  ];
  public myTabs: TabItem[] = [
    { id: 'dashboard', label: 'Dashboard', subtitle: 'Overview' },
    { id: 'subscription', label: 'Subscriber Management', subtitle: 'Manage Subscription' },
    { id: 'reports', label: 'Reports', subtitle: 'Analytics & Export' }
  ];

  public selectedTabId: string = 'capture';

  onTabChange(tabId: string) {
    this.selectedTabId = tabId;
    // Handle tab switching logic here
  }
}
