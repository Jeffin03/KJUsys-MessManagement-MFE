import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardModuleRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { BreadcrumbsTitleComponent } from '@libs/shared-ui';
import { TabsModule } from '@libs/tabs';



@NgModule({
  declarations: [
    DashboardComponent
  ],
  imports: [
    CommonModule,
    DashboardModuleRoutingModule,
    BreadcrumbsTitleComponent,
    TabsModule
  ]
  
})
export class DashboardModule { }
