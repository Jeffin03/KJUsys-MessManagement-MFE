import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubTabsComponent } from './sub-tabs.component';

/**
 * Module for the SubTabs library.
 * Exports SubTabsComponent for use in other modules.
 */
@NgModule({
  declarations: [
    SubTabsComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    SubTabsComponent
  ]
})
export class SubTabsModule { }
