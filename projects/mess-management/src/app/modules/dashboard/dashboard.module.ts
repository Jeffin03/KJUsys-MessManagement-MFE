import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardModuleRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { SubTabsModule } from '@libs/sub-tabs';
import { TabsModule } from '@libs/tabs';

@NgModule({
  imports: [
    CommonModule,
    DashboardModuleRoutingModule,
    SubTabsModule,
    TabsModule,
    DashboardComponent
  ],
  declarations: [
  ]
})
export class DashboardModule { }
