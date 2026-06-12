import { Component } from '@angular/core';
import { BreadcrumbsTitleComponent } from '@libs/shared-ui';
import { TabItem } from '@libs/tabs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent {

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
