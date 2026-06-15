import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-dashboard-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-tabs.component.html',
  styleUrls: ['./dashboard-tabs.component.css']
})
export class DashboardTabsComponent implements OnInit {
  activeTab = 'subscriber'; // default
  
  tabs = [
    { id: 'dashboard', label: 'Dashboard', sub: 'Overview' },
    { id: 'subscriber', label: 'Subscriber Management', sub: 'Manage Subscribers' },
    { id: 'reports', label: 'Reports', sub: 'View Reports' }
  ];

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    // Basic route matching using Angular Router
    const path = this.router.url;
    if (path.includes('dashboard')) this.activeTab = 'dashboard';
    else if (path.includes('reports')) this.activeTab = 'reports';
    else this.activeTab = 'subscriber';
  }

  setActive(tab: any) {
    this.activeTab = tab.id;
    if (tab.id === 'dashboard') {
      this.router.navigate(['../dashboard'], { relativeTo: this.route });
    } else if (tab.id === 'subscriber') {
      this.router.navigate(['../subscriber-management'], { relativeTo: this.route });
    } else if (tab.id === 'reports') {
      // this.router.navigate(['../reports'], { relativeTo: this.route });
    }
  }
}
