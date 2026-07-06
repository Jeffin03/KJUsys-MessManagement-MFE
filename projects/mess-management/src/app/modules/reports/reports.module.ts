import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { ReportsModuleRoutingModule } from './reports-routing.module';
import { ReportsComponent } from './reports.component';
import { AnalyticsDashboardComponent } from './components/analytics/analytics-dashboard.component';
import { AuditToolsComponent } from './components/audit/audit-tools.component';

import { TabsModule } from '@libs/tabs';
import { SubTabsModule } from '@libs/sub-tabs';
import { BreadcrumbsTitleComponent } from '@libs/shared-ui';

@NgModule({
  declarations: [
    ReportsComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule,
    ReportsModuleRoutingModule,
    TabsModule,
    SubTabsModule,
    BreadcrumbsTitleComponent,
    AnalyticsDashboardComponent,
    AuditToolsComponent,
  ]
})
export class ReportsModule { }
