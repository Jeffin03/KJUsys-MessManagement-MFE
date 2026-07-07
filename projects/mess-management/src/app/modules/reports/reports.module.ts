import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ReportsModuleRoutingModule } from './reports-routing.module';
import { ReportsComponent } from './reports.component';
import { AuditToolsComponent } from './components/audit/audit-tools.component';
import { ReportsDashboardComponent } from './components/reports-dashboard/reports-dashboard.component';

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
    FormsModule,
    ReportsModuleRoutingModule,
    TabsModule,
    SubTabsModule,
    BreadcrumbsTitleComponent,
    AuditToolsComponent,
    ReportsDashboardComponent,
  ]
})
export class ReportsModule { }
