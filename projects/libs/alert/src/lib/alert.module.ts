import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertComponent } from './alert.component';
import { AlertContainerComponent } from './alert-container.component';

@NgModule({
  declarations: [
    AlertComponent,
    AlertContainerComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    AlertComponent,
    AlertContainerComponent
  ]
})
export class AlertsModule { }
