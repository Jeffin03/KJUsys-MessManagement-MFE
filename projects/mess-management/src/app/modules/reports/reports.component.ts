import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TabItem } from '@libs/tabs';
import { SubTabItem } from '@libs/sub-tabs';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent {

  activeSubTab = 'analytics';

  subTabs: SubTabItem[] = [
    { id: 'analytics', label: 'Analytics Dashboard' },
    { id: 'audit', label: 'Audit Tools' },
  ];

  breadcrumbs = [
    { label: 'Hostel' },
    { label: 'Mess Management' }
  ];

  tabs: TabItem[] = [
    { id: 'dashboard', label: 'Dashboard', subtitle: 'Overview' },
    { id: 'subscriber', label: 'Subscriber Management', subtitle: 'Manage Subscribers' },
    { id: 'reports', label: 'Reports', subtitle: 'View Reports' }
  ];
  activeTab = 'reports';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) { }

  onTabChange(tabId: string) {
    this.activeTab = tabId;
    if (tabId === 'dashboard') {
      this.router.navigate(['../dashboard'], { relativeTo: this.route });
    } else if (tabId === 'subscriber') {
      this.router.navigate(['../subscriber-management'], { relativeTo: this.route });
    }
  }

  onSubTabChange(tabId: string) {
    this.activeSubTab = tabId;
  }
}
