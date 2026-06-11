import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardModuleRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';


@NgModule({
  declarations: [
    DashboardComponent
  ],
  imports: [
    CommonModule,
    DashboardModuleRoutingModule
  ]
})
export class DashboardModule { }
