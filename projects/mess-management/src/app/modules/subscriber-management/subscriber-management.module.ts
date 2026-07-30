import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SubscriberManagementModuleRoutingModule } from './subscriber-management-routing.module';
import { SubscriberManagementComponent } from './subscriber-management.component';
import { AddSubscriberModalComponent } from './components/add-subscriber-modal/add-subscriber-modal.component';
import { SubscriberStatsComponent } from './components/subscriber-stats/subscriber-stats.component';
import { SubscriberTableComponent } from './components/subscriber-table/subscriber-table.component';
import { TabsModule } from '@libs/tabs';


@NgModule({
  imports: [
    CommonModule,
    SubscriberManagementModuleRoutingModule,
    TabsModule,
    SubscriberManagementComponent,
    AddSubscriberModalComponent,
    SubscriberStatsComponent,
    SubscriberTableComponent
  ]
})
export class SubscriberManagementModule { }
