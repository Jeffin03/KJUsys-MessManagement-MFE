import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SubscriberManagementModuleRoutingModule } from './subscriber-management-routing.module';
import { SubscriberManagementComponent } from './subscriber-management.component';
import { AddSubscriberModalComponent } from './components/add-subscriber-modal/add-subscriber-modal.component';
import { SubscriberCardModalComponent } from './components/subscriber-card-modal/subscriber-card-modal.component';
import { SubscriberCardPreviewComponent } from './components/subscriber-card-preview/subscriber-card-preview.component';
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
    SubscriberCardModalComponent,
    SubscriberCardPreviewComponent,
    SubscriberStatsComponent,
    SubscriberTableComponent
  ]
})
export class SubscriberManagementModule { }
