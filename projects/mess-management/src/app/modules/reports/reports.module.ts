import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportsModuleRoutingModule } from './reports-routing.module';
import { ReportsComponent } from './reports.component';
import { TabsModule } from '@libs/tabs';
import { BreadcrumbsTitleComponent } from '@libs/shared-ui';

@NgModule({
  declarations: [
    ReportsComponent
  ],
  imports: [
    CommonModule,
    ReportsModuleRoutingModule,
    TabsModule,
    BreadcrumbsTitleComponent
  ]
})
export class ReportsModule { }
