import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TabsModule } from '@libs/tabs';

@Component({
  selector: 'app-dashboard-tabs',
  standalone: true,
  imports: [CommonModule, TabsModule],
  templateUrl: './dashboard-tabs.component.html',
  styleUrls: ['./dashboard-tabs.component.css']
})
export class DashboardTabsComponent implements OnInit {
  activeTab = 'subscriber'; // default
  
  tabs = [
    { id: 'dashboard', label: 'Dashboard', subtitle: 'Overview' },
    { id: 'subscriber', label: 'Subscriber Management', subtitle: 'Manage Subscribers' },
    { id: 'reports', label: 'Reports', subtitle: 'View Reports' }
  ];

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    // Basic route matching using Angular Router
    const path = this.router.url;
    if (path.includes('dashboard')) this.activeTab = 'dashboard';
    else if (path.includes('reports')) this.activeTab = 'reports';
    else this.activeTab = 'subscriber';
  }

  setActive(tabId: string) {
    this.activeTab = tabId;
    if (tabId === 'dashboard') {
      this.router.navigate(['../dashboard'], { relativeTo: this.route });
    } else if (tabId === 'subscriber') {
      this.router.navigate(['../subscriber-management'], { relativeTo: this.route });
    } else if (tabId === 'reports') {
      // this.router.navigate(['../reports'], { relativeTo: this.route });
    }
  }
}
