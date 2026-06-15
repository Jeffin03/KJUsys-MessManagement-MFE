import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardModuleRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { SubTabsModule } from '@libs/sub-tabs';


@NgModule({
  declarations: [
    DashboardComponent
  ],
  imports: [
    CommonModule,
    DashboardModuleRoutingModule,
    SubTabsModule
  ]
})
export class DashboardModule { }
