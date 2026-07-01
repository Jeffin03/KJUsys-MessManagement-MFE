import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { TabItem } from '@libs/tabs';
import { SubTabItem } from '@libs/sub-tabs';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit, OnDestroy {

  activeSubTab = 'student-search';
  studentRollNumber = '';
  private querySub: Subscription | null = null;

  subTabs: SubTabItem[] = [
    { id: 'student-search', label: 'Student Explorer' },
    { id: 'analytics', label: 'Analytics Dashboard' },
    { id: 'audit', label: 'Audit Tools' },
    { id: 'holidays', label: 'Holiday Calendar' },
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
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.querySub = this.route.queryParams.subscribe(params => {
      const roll = params['student'];
      if (roll) {
        this.studentRollNumber = roll;
        this.activeSubTab = 'student-detail';
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    this.querySub?.unsubscribe();
  }

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

  onViewStudent(rollNumber: string) {
    this.studentRollNumber = rollNumber;
    this.activeSubTab = 'student-detail';
    this.router.navigate([], { relativeTo: this.route, queryParams: { student: rollNumber }, queryParamsHandling: 'merge' });
  }

  backToSearch() {
    this.activeSubTab = 'student-search';
    this.studentRollNumber = '';
    this.router.navigate([], { relativeTo: this.route, queryParams: { student: null }, queryParamsHandling: 'merge' });
  }
}
